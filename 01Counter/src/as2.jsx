package StoreService

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"seekora-go/src/DataTypes"
	IndexService "seekora-go/src/RouteServices/IndexService"
	SearchCacheService "seekora-go/src/RouteServices/SearchCacheService"
	TypesenseStopwordsSynonymsService "seekora-go/src/RouteServices/TypesenseStopwordsSynonymsService"
	"seekora-go/src/db"
)

func GetAllStores(OrgId int) (*[]DataTypes.Store, error) {
	rows, err := db.GetDB().Query(`SELECT StoreID,
									OrgID,
									StoreName,
									Location,
									CreatedAt,
									CreatedBy,
									ModifiedAt,
									ModifiedBy,
									IsActive,
									XStoreID FROM mStores where orgId = $1`, OrgId)
	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, "No stores found with orgId: "+strconv.Itoa(OrgId)))
	}
	defer rows.Close()

	var stores []DataTypes.Store

	for rows.Next() {
		var store DataTypes.Store
		err := rows.Scan(
			&store.StoreID,
			&store.OrgID,
			&store.StoreName,
			&store.Location,
			&store.CreatedAt,
			&store.CreatedBy,
			&store.ModifiedAt,
			&store.ModifiedBy,
			&store.IsActive,
			&store.XStoreID,
		)
		if err != nil {
			panic(fiber.NewError(fiber.StatusInternalServerError, err.Error()))
		}
		stores = append(stores, store)
	}

	// Return an empty array if no stores are found
	if len(stores) == 0 {
		return &stores, nil
	}

	// Check for errors from iterating over rows.
	if err = rows.Err(); err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, err.Error()))
	}

	return &stores, nil
}

func GetStoreByID(storeID int) (*DataTypes.GetStoreResult, error) {
	var store DataTypes.GetStoreResult
	var searchConfig sql.NullString // Handle nullable config properly

	err := db.GetDB().QueryRow(`SELECT 
									mstores.StoreID,
									OrgID,
									StoreName,
									Location,
									mstores.CreatedAt,
									mstores.CreatedBy,
									mstores.ModifiedAt,
									mstores.ModifiedBy,
									IsActive, 
									mstores.alias,
									destinations.index, 
									destinations.config::text,
									mstores.XStoreID
								FROM mStores 
								LEFT JOIN destinations ON mStores.storeid=destinations.storeid 
								WHERE mstores.StoreID = $1 
								LIMIT 1`, storeID).Scan(
		&store.StoreID,
		&store.OrgID,
		&store.StoreName,
		&store.Location,
		&store.CreatedAt,
		&store.CreatedBy,
		&store.ModifiedAt,
		&store.ModifiedBy,
		&store.IsActive,
		&store.Alias,
		&store.IndexName,
		&searchConfig,
		&store.XStoreID,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			panic(fiber.NewError(fiber.StatusOK, "No store found with ID: "+strconv.Itoa(storeID)))
		}
		return nil, err
	}

	// If we have a saved config, use it directly
	if searchConfig.Valid && searchConfig.String != "" && searchConfig.String != "{}" {
		var tempConfig DataTypes.IndexConfig
		if err := json.Unmarshal([]byte(searchConfig.String), &tempConfig); err != nil {
			return nil, fmt.Errorf("failed to parse search config: %w", err)
		}

		// Validate the config
		if err := validateIndexConfig(tempConfig); err != nil {
			// If validation fails, fall back to defaults
			store.SearchConfig = getDefaultIndexConfig()
		} else {
			store.SearchConfig = tempConfig
		}
	} else {
		// No config saved, use defaults
		store.SearchConfig = getDefaultIndexConfig()
	}

	return &store, nil
}

// Add new function to get store by XStoreID
func GetStoreByXStoreID(xStoreID string) (*DataTypes.GetStoreResult, error) {
	var store DataTypes.GetStoreResult
	var searchConfig sql.NullString

	err := db.GetDB().QueryRow(`SELECT 
									mstores.StoreID,
									OrgID,
									StoreName,
									Location,
									mstores.CreatedAt,
									mstores.CreatedBy,
									mstores.ModifiedAt,
									mstores.ModifiedBy,
									IsActive, 
									mstores.alias,
									destinations.index, 
									destinations.config::text,
									mstores.XStoreID
								FROM mStores 
								LEFT JOIN destinations ON mStores.storeid=destinations.storeid 
								WHERE mstores.XStoreID = $1 
								LIMIT 1`, xStoreID).Scan(
		&store.StoreID,
		&store.OrgID,
		&store.StoreName,
		&store.Location,
		&store.CreatedAt,
		&store.CreatedBy,
		&store.ModifiedAt,
		&store.ModifiedBy,
		&store.IsActive,
		&store.Alias,
		&store.IndexName,
		&searchConfig,
		&store.XStoreID,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no store found with XStoreID: %s", xStoreID)
		}
		return nil, err
	}

	// Handle config parsing same as GetStoreByID
	if searchConfig.Valid && searchConfig.String != "" && searchConfig.String != "{}" {
		var tempConfig DataTypes.IndexConfig
		if err := json.Unmarshal([]byte(searchConfig.String), &tempConfig); err != nil {
			return nil, fmt.Errorf("failed to parse search config: %w", err)
		}

		if err := validateIndexConfig(tempConfig); err != nil {
			store.SearchConfig = getDefaultIndexConfig()
		} else {
			store.SearchConfig = tempConfig
		}
	} else {
		store.SearchConfig = getDefaultIndexConfig()
	}

	return &store, nil
}

func CreateStore(store DataTypes.Store, creatorId int) (int, error) {
	// Generate random values for store identifiers and indices
	xStoreID, err := generateRandomString(16)
	if err != nil {
		return 0, err
	}
	xStoreSecret := uuid.New().String()
	xStoreWriteSecret := uuid.New().String()

	// Generate unique random strings for indices
	categoryIndex, err := generateRandomString(16)
	if err != nil {
		return 0, err
	}
	brandIndex, err := generateRandomString(16)
	if err != nil {
		return 0, err
	}
	autoCompleteIndex, err := generateRandomString(16)
	if err != nil {
		return 0, err
	}
	productIndex, err := generateRandomString(16)
	if err != nil {
		return 0, err
	}

	query := `
	INSERT INTO mStores (
		OrgID, StoreName, Location, CreatedAt, CreatedBy,
		ModifiedAt, ModifiedBy, IsActive, XStoreID, XStoreSecret, XStoreWriteSecret,
		CategoryIndex, BrandIndex, AutoCompleteIndex, ProductIndex
	)
	VALUES (
		$1, $2, $3, $4, $5,
		$6, $7, $8, $9, $10, $11,
		$12, $13, $14, $15
	) RETURNING StoreID;`

	var storeId int
	err = db.GetDB().QueryRow(query,
		store.OrgID, store.StoreName, store.Location, time.Now().UTC(), creatorId,
		nil, nil, true, xStoreID, xStoreSecret, xStoreWriteSecret,
		categoryIndex, brandIndex, autoCompleteIndex, productIndex).Scan(&storeId)

	if err != nil {
		return 0, err
	}

	fmt.Printf("Store created with ID: %d\n", storeId)
	return storeId, nil
}

func UpdateStore(store DataTypes.Store, ModifiedUserID int) error {
	query := `
        UPDATE mStores
        SET
            OrgID = $1,
            StoreName = $2,
            Location = $3,
            ModifiedAt = $4,
            ModifiedBy = $5
        WHERE
            StoreID = $6`

	_, err := db.GetDB().Exec(query,
		store.OrgID,
		store.StoreName,
		store.Location,
		time.Now().UTC().Format("2006-01-02 15:04:05"),
		ModifiedUserID,
		store.StoreID)

	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, err.Error()))
	}

	fmt.Printf("Store with ID %d updated successfully\n", store.StoreID)
	return nil
}

func UpdateStoreStatus(storeID int, status string, ModifiedUserID int) error {
	query := `
    UPDATE mStores
    SET ModifiedAt = $1, ModifiedBy=$2, isActive=$3
    WHERE
        StoreID = $4`

	_, err := db.GetDB().Exec(query,
		time.Now().UTC(), ModifiedUserID, status, storeID,
	)

	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, err.Error()))
	}

	fmt.Printf("Store status updated successfully with ID %d", storeID)
	return nil
}

// UpdateStoreConfig updates the store configuration by proxying the update to the index configuration
func UpdateStoreConfig(storeID int, userID int, config DataTypes.IndexConfig) error {
	return updateStoreConfig(storeID, userID, config, true) // Always validate for direct calls
}

// updateStoreConfig is the internal implementation that can skip validation
func updateStoreConfig(storeID int, userID int, config DataTypes.IndexConfig, shouldValidate bool) error {
	// Validate the config before updating (only if requested)
	if shouldValidate {
		if err := validateIndexConfig(config); err != nil {
			return fmt.Errorf("invalid configuration: %w", err)
		}
	}

	// Fetch the store details to get the index name
	store, err := GetStoreByID(storeID)
	if err != nil {
		return fmt.Errorf("failed to fetch store details: %w", err)
	}

	if store.IndexName == nil {
		return fmt.Errorf("store has no associated index")
	}

	// Use the index name to update the index configuration
	// Pass the config as-is without merging with defaults
	// Skip validation here since we handle it in the calling function
	if err := IndexService.UpdateIndexConfigWithoutValidation(userID, *store.IndexName, config); err != nil {
		return fmt.Errorf("failed to update store configuration: %w", err)
	}

	// Update stopwords and synonyms in Typesense if provided
	// Check both old format (config.Stopwords/Synonyms) and new flattened format
	var stopwordsSynonymsConfig DataTypes.StopwordsSynonymsConfig

	// Use the flattened format
	if config.DefaultStopwordsSet != nil ||
		len(config.Stopwords) > 0 ||
		len(config.Synonyms) > 0 {
		stopwordsSynonymsConfig = DataTypes.StopwordsSynonymsConfig{
			Stopwords:           config.Stopwords,
			Synonyms:            config.Synonyms,
			DefaultStopwordsSet: config.DefaultStopwordsSet,
		}
	} else if len(config.Stopwords) > 0 || len(config.Synonyms) > 0 {
		// Fall back to old format for backward compatibility (if old fields still exist)
		stopwordsSynonymsConfig = DataTypes.StopwordsSynonymsConfig{
			Stopwords: config.Stopwords,
			Synonyms:  config.Synonyms,
		}
	}

	// Update stopwords and synonyms in Typesense if any are provided
	if len(stopwordsSynonymsConfig.Stopwords) > 0 || len(stopwordsSynonymsConfig.Synonyms) > 0 {
		aliasToUse := ""
		if store.Alias != nil && *store.Alias != "" {
			aliasToUse = *store.Alias
		} else if store.IndexName != nil {
			aliasToUse = *store.IndexName
		}

		if aliasToUse != "" {
			if err := TypesenseStopwordsSynonymsService.UpdateStopwordsAndSynonyms(aliasToUse, stopwordsSynonymsConfig); err != nil {
				// Log the error but don't fail the entire operation
			}
		}
	}

	// Update Typesense schema if schema-level fields are provided
	if config.DefaultSortingField != nil || len(config.SymbolsToIndex) > 0 || len(config.TokenSeparators) > 0 {
		// Use the alias instead of IndexName for schema updates
		aliasToUse := ""
		if store.Alias != nil && *store.Alias != "" {
			aliasToUse = *store.Alias
		} else if store.IndexName != nil {
			aliasToUse = *store.IndexName
		}

		if aliasToUse != "" {
			if err := IndexService.UpdateTypesenseSchema(aliasToUse, config); err != nil {
				// Log the error but don't fail the entire operation
				fmt.Printf("Warning: failed to update Typesense schema: %v\n", err)
			}
		} else {
			fmt.Printf("Warning: No alias or index name found for store, skipping schema update\n")
		}
	}

	// Invalidate Redis cache for this store's search configuration
	if err := SearchCacheService.InvalidateStoreSearchCache(storeID); err != nil {
		// Log the error but don't fail the entire operation
		fmt.Printf("Warning: failed to invalidate search cache for store %d: %v\n", storeID, err)
	}

	return nil
}

// CreateStoreConfig creates a new configuration for a store with validation
func CreateStoreConfig(storeID int, userID int, config DataTypes.IndexConfig) error {

	if storeID <= 0 {
		return fmt.Errorf("invalid store ID: %d", storeID)
	}

	if userID <= 0 {
		return fmt.Errorf("invalid user ID: %d", userID)
	}

	// Validate the config before creating
	if err := validateIndexConfig(config); err != nil {
		return fmt.Errorf("invalid configuration: %w", err)
	}

	store, err := GetStoreByID(storeID)
	if err != nil {
		return fmt.Errorf("failed to fetch store details: %w", err)
	}

	// Handle case where IndexName might be nil
	if store.IndexName == nil {
		return fmt.Errorf("store does not have an associated index")
	}

	if err := IndexService.CreateIndexConfig(userID, *store.IndexName, config); err != nil {
		return fmt.Errorf("failed to create store configuration: %w", err)
	}

	return nil
}

// GetStoreConfig retrieves the configuration for a store
func GetStoreConfig(storeID int) (*DataTypes.IndexConfig, error) {
	store, err := GetStoreByID(storeID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch store details: %w", err)
	}

	if store.IndexName == nil {
		return nil, fmt.Errorf("store does not have an associated index")
	}

	config, err := IndexService.GetIndexConfig(*store.IndexName)
	if err != nil {
		return nil, fmt.Errorf("failed to get store configuration: %w", err)
	}

	return config, nil
}

// DeleteStoreConfig deletes the configuration for a store
func DeleteStoreConfig(storeID int, userID int) error {
	store, err := GetStoreByID(storeID)
	if err != nil {
		return fmt.Errorf("failed to fetch store details: %w", err)
	}

	// Handle case where IndexName might be nil
	if store.IndexName == nil {
		return fmt.Errorf("store does not have an associated index")
	}

	if err := IndexService.DeleteIndexConfig(userID, *store.IndexName); err != nil {
		return fmt.Errorf("failed to delete store configuration: %w", err)
	}

	return nil
}

// generateRandomString generates a random string of the specified length.
func generateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes)[:length], nil
}

func GetStoreByXStoreIDAndSecret(xStoreID string, xStoreSecret string) (*DataTypes.Store, error) {
	var store DataTypes.Store
	err := db.GetDB().QueryRow(`SELECT 
									StoreID,
									OrgID,
									StoreName,
									Location,
									CreatedAt,
									CreatedBy,
									ModifiedAt,
									ModifiedBy,
									IsActive FROM mStores where XStoreID = $1 and XStoreSecret = $2`, xStoreID, xStoreSecret).Scan(
		&store.StoreID,
		&store.OrgID,
		&store.StoreName,
		&store.Location,
		&store.CreatedAt,
		&store.CreatedBy,
		&store.ModifiedAt,
		&store.ModifiedBy,
		&store.IsActive,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no store found with XStoreID: %s", xStoreID)
		}
		return nil, err
	}
	return &store, nil
}

func GetStoreByXStoreIDAndWriteSecret(xStoreID string, xStoreWriteSecret string) (*DataTypes.Store, error) {
	var store DataTypes.Store
	err := db.GetDB().QueryRow(`SELECT 
									StoreID,
									OrgID,
									StoreName,
									Location,
									CreatedAt,
									CreatedBy,
									ModifiedAt,
									ModifiedBy,
									IsActive FROM mStores where XStoreID = $1 and XStoreWriteSecret = $2`, xStoreID, xStoreWriteSecret).Scan(
		&store.StoreID,
		&store.OrgID,
		&store.StoreName,
		&store.Location,
		&store.CreatedAt,
		&store.CreatedBy,
		&store.ModifiedAt,
		&store.ModifiedBy,
		&store.IsActive,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no store found with XStoreID: %s and write secret", xStoreID)
		}
		return nil, err
	}
	return &store, nil
}

// GetStoreWithOrgCodeByXStoreIDAndSecret retrieves store along with orgcode for analytics/ClickHouse integration
func GetStoreWithOrgCodeByXStoreIDAndSecret(xStoreID string, xStoreSecret string) (*DataTypes.Store, string, error) {
	var store DataTypes.Store
	var orgCode string

	err := db.GetDB().QueryRow(`SELECT 
									s.StoreID,
									s.OrgID,
									s.StoreName,
									s.Location,
									s.CreatedAt,
									s.CreatedBy,
									s.ModifiedAt,
									s.ModifiedBy,
									s.IsActive,
									o.orgcode
								FROM mStores s
								JOIN mOrganization o ON s.OrgID = o.orgid
								WHERE s.XStoreID = $1 AND s.XStoreSecret = $2`, xStoreID, xStoreSecret).Scan(
		&store.StoreID,
		&store.OrgID,
		&store.StoreName,
		&store.Location,
		&store.CreatedAt,
		&store.CreatedBy,
		&store.ModifiedAt,
		&store.ModifiedBy,
		&store.IsActive,
		&orgCode,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, "", fmt.Errorf("no store found with XStoreID: %s", xStoreID)
		}
		return nil, "", err
	}
	return &store, orgCode, nil
}

// GetStoreCredentials returns all store credentials (xStoreID, xStoreSecret, xStoreWriteSecret) for a given store ID
func GetStoreCredentials(storeID int) (*DataTypes.StoreCredentials, error) {
	var credentials DataTypes.StoreCredentials
	err := db.GetDB().QueryRow(`SELECT 
									XStoreID,
									XStoreSecret,
									XStoreWriteSecret 
								FROM mStores 
								WHERE StoreID = $1`, storeID).Scan(
		&credentials.XStoreID,
		&credentials.XStoreSecret,
		&credentials.XStoreWriteSecret,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no store found with ID: %d", storeID)
		}
		return nil, err
	}
	return &credentials, nil
}

func GetOrgCodeByOrgID(orgID int) (string, error) {
	var orgCode string
	err := db.GetDB().QueryRow(SELECT orgcode FROM mOrganization WHERE orgid = $1, orgID).Scan(&orgCode)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("no organization found with ID: %d", orgID)
		}
		return "", err
	}
	return orgCode, nil
}

// getDefaultIndexConfig returns a default IndexConfig with sensible defaults
func getDefaultIndexConfig() DataTypes.IndexConfig {
	return IndexService.GetDefaultIndexConfig()
}

// validateIndexConfig validates the IndexConfig structure
func validateIndexConfig(config DataTypes.IndexConfig) error {
	// For array format, check if QueryBy array is not empty
	if len(config.QueryBy) == 0 {
		return fmt.Errorf("query_by field is required")
	}

	// Validate pagination values
	if config.Page != nil && *config.Page < 1 {
		return fmt.Errorf("page must be greater than 0")
	}
	if config.PerPage != nil && (*config.PerPage < 1 || *config.PerPage > 250) {
		return fmt.Errorf("per_page must be between 1 and 250")
	}

	// Validate typo tolerance settings
	if config.NumTypos != nil && (*config.NumTypos < 0 || *config.NumTypos > 2) {
		return fmt.Errorf("num_typos must be between 0 and 2")
	}

	// Validate search strategy if provided
	if config.SearchStrategy != nil {
		validStrategies := map[string]bool{"text": true, "vector": true, "hybrid": true}
		if !validStrategies[*config.SearchStrategy] {
			return fmt.Errorf("search_strategy must be one of: text, vector, hybrid")
		}
	}

	return nil
}

// UpdateStoreConfigPartial updates only specific parts of the store configuration
func UpdateStoreConfigPartial(storeID int, userID int, partialConfig DataTypes.IndexConfig) error {
	// Get existing config
	existingConfig, err := GetStoreConfig(storeID)
	if err != nil {
		// If no config exists, start with empty config (not default) for better merging
		existingConfig = &DataTypes.IndexConfig{}
	}

	// Use IndexService's merge function instead of local duplicate
	mergedConfig := IndexService.MergeConfigs(*existingConfig, partialConfig)

	// For partial updates, we need to be more lenient with validation
	// Only require QueryBy if it was explicitly provided in the partial config
	shouldValidate := false

	if len(partialConfig.QueryBy) > 0 {
		// QueryBy was explicitly provided, so we should validate
		shouldValidate = true
	} else if len(existingConfig.QueryBy) > 0 {
		// We have a meaningful QueryBy from existing config, so we can validate
		shouldValidate = true
	} else {
		// No meaningful QueryBy in either partial or existing config
		// For partial updates, this is acceptable - validation will happen during search
	}

	// Only validate if we determined we should
	if shouldValidate {
		if err := validateIndexConfig(mergedConfig); err != nil {
			return fmt.Errorf("invalid merged configuration: %w", err)
		}
	}

	// Update with merged config - skip validation since we already handled it above
	return updateStoreConfig(storeID, userID, mergedConfig, false)
}