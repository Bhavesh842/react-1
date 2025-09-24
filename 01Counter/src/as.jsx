package StoreRoute

import (
	"fmt"
	"log"
	"seekora-go/src/DataTypes"
	"seekora-go/src/RouteServices/DocumentService"
	"seekora-go/src/RouteServices/IndexService"
	"seekora-go/src/RouteServices/StoreService"
	"seekora-go/src/db"
	"seekora-go/src/middlewares"

	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetAllStores godoc
// @Summary      Fetches list of all stores
// @Description  Fetches list of all stores for the authenticated user's organization
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Success      200    {object}  DataTypes.StoresListResponse "StoresListResponse"
// @Failure      400    {object}  DataTypes.Response "Invalid credentials"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores [get]
// @Security BearerAuth
func GetAllStores(c *fiber.Ctx) error {
	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		log.Println("Error extracting user ID:", err)
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	// Get user's organization ID
	orgID, err := getUserOrgID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to get user organization: " + err.Error(),
		})
	}

	stores, err := StoreService.GetAllStores(orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: err.Error(),
		})
	}
	responseData := DataTypes.StoresListResponse{
		Status:  fiber.StatusOK,
		Message: "success",
		Data:    *stores,
	}
	return c.Status(fiber.StatusOK).JSON(responseData)
}

func GetStoreByID(c *fiber.Ctx) error {
	id := c.Params("storeID")
	storeID, err := strconv.Atoi(id)
	if err != nil {
		panic(fiber.NewError(fiber.StatusBadRequest, "Invalid organization ID"))
	}

	stores, err := StoreService.GetStoreByID(storeID)
	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, err.Error()))
	}
	responseData := DataTypes.StoreResponse{
		Status:  fiber.StatusOK,
		Message: "success",
		Data:    *stores,
	}
	return c.Status(fiber.StatusOK).JSON(responseData)
}

// GetStoreByXStoreID godoc
// @Summary      Fetches stores by xStoreID
// @Description  Fetches stores by xStoreID
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        xStoreID   path      string  true  "X-Store ID"
// @Success      200  {object}  DataTypes.StoreResponse "Successful response"
// @Failure      400    {object}  DataTypes.Response "Invalid credentials"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/GetStore/{xStoreID} [get]
// @Security BearerAuth
func GetStoreByXStoreID(c *fiber.Ctx) error {
	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	store, err := StoreService.GetStoreByXStoreID(xStoreID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: err.Error(),
		})
	}

	responseData := DataTypes.StoreResponse{
		Status:  fiber.StatusOK,
		Message: "success",
		Data:    *store,
	}
	return c.Status(fiber.StatusOK).JSON(responseData)
}

// GetStoreCredentials godoc
// @Summary      Get store credentials
// @Description  Retrieves all store credentials (XStoreID, XStoreSecret, XStoreWriteSecret) for a given x-store ID
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        xStoreID   path      string  true  "X-Store ID"
// @Success      200  {object}  DataTypes.StoreCredentialsResponse "Successful response"
// @Failure      400    {object}  DataTypes.Response "Invalid x-store ID"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      404    {object}  DataTypes.Response "Store not found"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/credentials [get]
// @Security BearerAuth
func GetStoreCredentials(c *fiber.Ctx) error {
	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		log.Println("Error extracting user ID:", err)
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	// Parse x-store ID from URL parameter
	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	// Verify user has access to this store by checking organization
	orgID, err := getUserOrgID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to get user organization: " + err.Error(),
		})
	}

	// Get store by xStoreID and verify it belongs to the user's organization
	store, err := StoreService.GetStoreByXStoreID(xStoreID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Store not found",
		})
	}

	if store.OrgID != orgID {
		return c.Status(fiber.StatusForbidden).JSON(DataTypes.Response{
			Status:  403,
			Message: "Access denied: Store does not belong to your organization",
		})
	}

	// Get store credentials
	credentials, err := StoreService.GetStoreCredentials(store.StoreID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to retrieve store credentials: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(DataTypes.StoreCredentialsResponse{
		Status:  200,
		Message: "Store credentials retrieved successfully",
		Data:    *credentials,
	})
}

// CreateStore godoc
// @Summary      Creates a new store
// @Description  Adds a new store to the system
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        Store body      DataTypes.StoreRequestDto  true  "data"
// @Success      200   {object}  DataTypes.Response "Store successfully created"
// @Failure      400    {object}  DataTypes.Response "Invalid credentials"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores [post]
// @Security BearerAuth
func CreateStore(c *fiber.Ctx) error {
	var req DataTypes.StoreRequestDto
	if err := c.BodyParser(&req); err != nil {
		panic(fiber.NewError(fiber.StatusBadRequest, err.Error()))
	}

	creatorId, err := middlewares.GetUserID(c)
	if err != nil {
		log.Println("Error extracting user ID:", err)
		panic(fiber.NewError(fiber.StatusUnauthorized, "Unauthorized: Unable to retrieve user ID"))
	}
	store := DataTypes.Store{
		BaseStore: DataTypes.BaseStore{
			OrgID:     req.OrgID,
			StoreName: req.StoreName,
			Location:  req.Location,
		},
	}
	storeId, err := StoreService.CreateStore(store, creatorId)
	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, err.Error()))
	}
	responseData := DataTypes.Response{
		Status:  fiber.StatusOK,
		Message: "Store created successfully",
		Data:    strconv.Itoa(storeId),
	}
	return c.Status(fiber.StatusOK).JSON(responseData)
}

// @Summary Update an existing store
// @Description Updates store information by ID.
// @Tags Stores
// @Accept json
// @Produce json
// @Param storeID path int true "store ID"
// @Param Store body DataTypes.StoreRequestDto true "Store data to update"
// @Success      200   {object}  DataTypes.Response "Store updated successfully"
// @Failure      400    {object}  DataTypes.Response "Invalid credentials"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router /admin/Stores/{storeID} [put]
// @Security BearerAuth
func UpdateStore(c *fiber.Ctx) error {
	id := c.Params("storeID")
	var req DataTypes.StoreRequestDto
	if err := c.BodyParser(&req); err != nil {
		panic(fiber.NewError(fiber.StatusBadRequest, "Cannot parse JSON"))
	}

	storeID, err := strconv.Atoi(id)
	if err != nil {
		panic(fiber.NewError(fiber.StatusBadRequest, "Invalid storeId format"))
	}

	isExist, err := StoreService.GetStoreByID(storeID)
	if err != nil {
		panic(fiber.NewError(fiber.StatusNotFound, err.Error()))
	}
	if isExist == nil {
		panic(fiber.NewError(fiber.StatusNotFound, "No Store found with ID "+strconv.Itoa(storeID)))
	}

	ModifiedUserID, err := middlewares.GetUserID(c)
	if err != nil {
		log.Println("Error extracting user ID:", err)
		panic(fiber.NewError(fiber.StatusUnauthorized, "Unauthorized: Unable to retrieve user ID"))
	}

	store := DataTypes.Store{
		BaseStore: DataTypes.BaseStore{
			StoreID:   storeID,
			OrgID:     req.OrgID,
			StoreName: req.StoreName,
			Location:  req.Location,
		},
	}

	err = StoreService.UpdateStore(store, ModifiedUserID)
	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, "Failed to update store"))
	}
	responseData := DataTypes.Response{
		Status:  fiber.StatusOK,
		Message: "Store updated successfully",
		Data:    id,
	}
	return c.Status(fiber.StatusOK).JSON(responseData)
}

// @Summary Update an existing  StoreStatus
// @Description Updates StoreStatus information by ID.
// @Tags Stores
// @Accept json
// @Produce json
// @Param id path int true "Store ID"
// @Param status path boolean true "status"
// @Success      200   {object}  DataTypes.Response "Store updated successfully"
// @Failure      400    {object}  DataTypes.Response "Invalid credentials"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router /admin/Stores/UpdateStatus/{id}/{status} [put]
// @Security BearerAuth
func UpdateStoreStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	status := c.Params("status")
	storeId, err := strconv.Atoi(id)
	if err != nil {
		panic(fiber.NewError(fiber.StatusBadRequest, "Invalid ServiceRequest ID format"))
	}
	statusBool, err := strconv.ParseBool(status)
	if err != nil {
		panic(fiber.NewError(fiber.StatusBadRequest, "Invalid status value"))
	}

	isExist, err := StoreService.GetStoreByID(storeId)
	if err != nil {
		panic(fiber.NewError(fiber.StatusNotFound, err.Error()))
	}
	if isExist == nil {
		panic(fiber.NewError(fiber.StatusNotFound, "No store found with ID: "+id))
	}
	if isExist.IsActive == statusBool {
		panic(fiber.NewError(fiber.StatusNotModified, "Store status already "+status+" with ID: "+id))
	}

	ModifiedUserID, err := middlewares.GetUserID(c)
	if err != nil {
		log.Println("Error extracting user ID:", err)
		panic(fiber.NewError(fiber.StatusUnauthorized, "Unauthorized: Unable to retrieve user ID"))
	}

	err = StoreService.UpdateStoreStatus(storeId, status, ModifiedUserID)
	if err != nil {
		panic(fiber.NewError(fiber.StatusInternalServerError, "Failed to change status of store of Id: "+id))
	}
	responseData := DataTypes.Response{
		Status:  fiber.StatusOK,
		Message: "Store status updated successfully",
		Data:    id,
	}
	return c.Status(fiber.StatusOK).JSON(responseData)
}

// UpdateStoreConfig godoc
// @Summary      Update Store Config (Partial)
// @Description  Updates the store configuration using x-store ID. Supports partial updates - you can update individual fields without providing all required fields. Now supports stopwords and synonyms configuration for enhanced search capabilities.
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        xStoreID path string true "X-Store ID"
// @Param        body    body DataTypes.IndexConfig true "Store configuration (partial updates supported) including stopwords and synonyms"
// @Success      200     {object} DataTypes.IndexConfigResponseWrapper "Store configuration updated successfully"
// @Failure      400     {object} DataTypes.Response "Invalid request"
// @Failure      401     {object} DataTypes.Response "Unauthorized"
// @Failure      500     {object} DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/config [put]
// @Security BearerAuth
func UpdateStoreConfig(c *fiber.Ctx) error {
	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	// Get store by XStoreID to get the actual storeID
	store, err := StoreService.GetStoreByXStoreID(xStoreID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Store not found: " + err.Error(),
		})
	}

	var config DataTypes.IndexConfig
	if err := c.BodyParser(&config); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid request body",
		})
	}

	userID, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	if err := StoreService.UpdateStoreConfigPartial(store.StoreID, userID, config); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to update store configuration: " + err.Error(),
		})
	}

	updatedStore, err := StoreService.GetStoreByID(store.StoreID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to retrieve updated store configuration: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.IndexConfigResponseWrapper{
		Status:  200,
		Message: "Store configuration updated successfully",
		Data:    updatedStore.SearchConfig,
	})
}

// GetStoreConfig godoc
// @Summary      Get Store Config
// @Description  Retrieves the store configuration using x-store ID
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        xStoreID path string true "X-Store ID"
// @Success      200     {object} DataTypes.IndexConfigResponseWrapper "Store configuration retrieved successfully"
// @Failure      400     {object} DataTypes.Response "Invalid request"
// @Failure      401     {object} DataTypes.Response "Unauthorized"
// @Failure      500     {object} DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/config [get]
// @Security BearerAuth
func GetStoreConfig(c *fiber.Ctx) error {
	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	store, err := StoreService.GetStoreByXStoreID(xStoreID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Store not found: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.IndexConfigResponseWrapper{
		Status:  200,
		Message: "Store configuration retrieved successfully",
		Data:    store.SearchConfig,
	})
}

// GetStoreConfigSchema godoc
// @Summary      Get Store Config Schema
// @Description  Get metadata about all configurable fields for store configuration using x-store ID
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        xStoreID path string true "X-Store ID to get field options from"
// @Success      200     {object} DataTypes.ConfigurationSchemaResponseWrapper "Configuration schema retrieved successfully"
// @Failure      400     {object} DataTypes.Response "Invalid store ID"
// @Failure      401     {object} DataTypes.Response "Unauthorized"
// @Failure      500     {object} DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/config-schema [get]
// @Security BearerAuth
func GetStoreConfigSchema(c *fiber.Ctx) error {

	_, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	store, err := StoreService.GetStoreByXStoreID(xStoreID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Store not found: " + err.Error(),
		})
	}

	var schema DataTypes.ConfigurationSchema

	if store.IndexName != nil {
		schema = IndexService.GetConfigurationSchemaForIndex(*store.IndexName)
	} else {
		schema = IndexService.GetConfigurationSchema()
	}

	return c.JSON(DataTypes.ConfigurationSchemaResponseWrapper{
		Status:  200,
		Message: "Configuration schema retrieved successfully",
		Data:    schema,
	})
}

// GetStoreSchemaBasedDefaults godoc
// @Summary      Get Store Schema-Based Defaults
// @Description  Get default configuration values computed from the store's index schema using x-store ID
// @Tags         Stores
// @Accept       json
// @Produce      json
// @Param        xStoreID path string true "X-Store ID"
// @Success      200     {object} DataTypes.SchemaBasedDefaultsResponseWrapper "Schema-based defaults retrieved successfully"
// @Failure      400     {object} DataTypes.Response "Invalid request"
// @Failure      401     {object} DataTypes.Response "Unauthorized"
// @Failure      500     {object} DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/defaults [get]
// @Security BearerAuth
func GetStoreSchemaBasedDefaults(c *fiber.Ctx) error {
	_, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	store, err := StoreService.GetStoreByXStoreID(xStoreID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Store not found: " + err.Error(),
		})
	}

	if store.IndexName == nil {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Store does not have an associated index",
		})
	}

	defaults, err := IndexService.GetSchemaBasedDefaults(*store.IndexName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to get schema-based defaults: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.SchemaBasedDefaultsResponse{
		Status:  200,
		Message: "Schema-based defaults retrieved successfully",
		Data:    *defaults,
	})
}

// UploadDocument godoc
// @Summary      Upload a document
// @Description  Uploads a document to the specified store
// @Tags         Documents
// @Accept       multipart/form-data
// @Produce      json
// @Param        xStoreID   path      string  true  "X-Store ID"
// @Param        file        formData  file    true  "Document file"
// @Success      200  {object}  DataTypes.Response "Successful response"
// @Failure      400    {object}  DataTypes.Response "Invalid request"
// @Failure      401   {object}   DataTypes.Response "Unauthorized: Unable to retrieve user ID"
// @Failure      500    {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/upload [post]
// @Security BearerAuth
func UploadDocument(c *fiber.Ctx) error {
	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		log.Println("Error extracting user ID:", err)
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	// Parse the file from the request
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid request format",
		})
	}

	files := form.File["file"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "No files uploaded",
		})
	}

	// Upload each file
	var fileUrls []string
	for _, file := range files {
		// Validate file size (e.g., max 10 MB)
		if file.Size > 10*1024*1024 {
			return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
				Status:  400,
				Message: "File size exceeds the 10 MB limit",
			})
		}

		// Generate a unique file name and save the file
		filePath, err := DocumentService.SaveDocument(file, xStoreID, userID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
				Status:  500,
				Message: "Failed to save document: " + err.Error(),
			})
		}
		fileUrls = append(fileUrls, filePath)
	}

	return c.Status(fiber.StatusOK).JSON(DataTypes.GenericResponse[[]string]{
		Status:  200,
		Message: "Documents uploaded successfully",
		Data:    fileUrls,
	})
}

// GetDocuments godoc
// @Summary      Get documents from store
// @Description  Retrieves documents from a store with pagination and optional filtering
// @Tags         Store Documents
// @Accept       json
// @Produce      json
// @Param        xStoreID   path      string  true  "X-Store ID"
// @Param        page       query     int     false "Page number (default: 1)"
// @Param        limit      query     int     false "Results per page (default: 20, max: 100)"
// @Param        search     query     string  false "Search query"
// @Param        filter     query     string  false "JSON filter object"
// @Param        sort       query     string  false "Sort field and direction (e.g., 'created_at:desc')"
// @Success      200        {object}  DataTypes.DocumentListResponseWrapper "Documents retrieved successfully"
// @Failure      400        {object}  DataTypes.Response "Invalid request"
// @Failure      401        {object}  DataTypes.Response "Unauthorized"
// @Failure      404        {object}  DataTypes.Response "Store not found"
// @Failure      500        {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/documents [get]
// @Security BearerAuth
func GetDocuments(c *fiber.Ctx) error {
	// Get user ID from authentication
	_, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	// Parse query parameters
	params := DataTypes.DocumentQueryParams{}
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			params.Page = page
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			params.Limit = limit
		}
	}
	params.Search = c.Query("search")
	params.Filter = c.Query("filter")
	params.Sort = c.Query("sort")

	// Get documents
	response, err := DocumentService.GetDocuments(xStoreID, params)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to retrieve documents: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.DocumentListResponseWrapper{
		Status:  200,
		Message: "Documents retrieved successfully",
		Data:    *response,
	})
}

// GetDocument godoc
// @Summary      Get single document
// @Description  Retrieves a single document by ID from a store
// @Tags         Store Documents
// @Accept       json
// @Produce      json
// @Param        xStoreID    path      string  true  "X-Store ID"
// @Param        documentID  path      string  true  "Document ID"
// @Success      200         {object}  DataTypes.DocumentResponseWrapper "Document retrieved successfully"
// @Failure      400         {object}  DataTypes.Response "Invalid request"
// @Failure      401         {object}  DataTypes.Response "Unauthorized"
// @Failure      404         {object}  DataTypes.Response "Document not found"
// @Failure      500         {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/documents/{documentID} [get]
// @Security BearerAuth
func GetDocument(c *fiber.Ctx) error {
	// Get user ID from authentication
	_, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	documentID := c.Params("documentID")

	if xStoreID == "" || documentID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID or document ID",
		})
	}

	// Get document
	response, err := DocumentService.GetDocument(xStoreID, documentID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Document not found: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.DocumentResponseWrapper{
		Status:  200,
		Message: "Document retrieved successfully",
		Data:    *response,
	})
}

// InsertDocument godoc
// @Summary      Insert document
// @Description  Inserts a new document into a store. If ID is provided, it will be used; otherwise, a hash-based ID will be generated. If a document with the same hash already exists, it will be updated.
// @Tags         Store Documents
// @Accept       json
// @Produce      json
// @Param        xStoreID  path      string                    true  "X-Store ID"
// @Param        body      body      DataTypes.DocumentRequest true  "Document data"
// @Success      201       {object}  DataTypes.DocumentResponseWrapper "Document inserted successfully"
// @Failure      400       {object}  DataTypes.Response "Invalid request"
// @Failure      401       {object}  DataTypes.Response "Unauthorized"
// @Failure      404       {object}  DataTypes.Response "Store not found"
// @Failure      500       {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/documents [post]
// @Security BearerAuth
func InsertDocument(c *fiber.Ctx) error {
	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	var req DataTypes.DocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid request body: " + err.Error(),
		})
	}

	// Insert document
	response, err := DocumentService.InsertDocument(xStoreID, req, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to insert document: " + err.Error(),
		})
	}

	statusCode := fiber.StatusCreated
	if response.Status == DataTypes.StatusUpdated {
		statusCode = fiber.StatusOK
	}

	return c.Status(statusCode).JSON(DataTypes.DocumentResponseWrapper{
		Status:  statusCode,
		Message: response.Message,
		Data:    *response,
	})
}

// UpdateDocument godoc
// @Summary      Update document
// @Description  Updates an existing document by ID. The document ID will not change even if document properties change.
// @Tags         Store Documents
// @Accept       json
// @Produce      json
// @Param        xStoreID    path      string                    true  "X-Store ID"
// @Param        documentID  path      string                    true  "Document ID"
// @Param        body        body      DataTypes.DocumentRequest true  "Document data"
// @Success      200         {object}  DataTypes.DocumentResponseWrapper "Document updated successfully"
// @Failure      400         {object}  DataTypes.Response "Invalid request"
// @Failure      401         {object}  DataTypes.Response "Unauthorized"
// @Failure      404         {object}  DataTypes.Response "Document not found"
// @Failure      500         {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/documents/{documentID} [put]
// @Security BearerAuth
func UpdateDocument(c *fiber.Ctx) error {
	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	documentID := c.Params("documentID")

	if xStoreID == "" || documentID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID or document ID",
		})
	}

	var req DataTypes.DocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid request body: " + err.Error(),
		})
	}

	// Update document
	response, err := DocumentService.UpdateDocument(xStoreID, documentID, req, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to update document: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.DocumentResponseWrapper{
		Status:  200,
		Message: response.Message,
		Data:    *response,
	})
}

// DeleteDocument godoc
// @Summary      Delete document
// @Description  Deletes a document by ID from a store
// @Tags         Store Documents
// @Accept       json
// @Produce      json
// @Param        xStoreID    path      string  true  "X-Store ID"
// @Param        documentID  path      string  true  "Document ID"
// @Success      200         {object}  DataTypes.DocumentResponseWrapper "Document deleted successfully"
// @Failure      400         {object}  DataTypes.Response "Invalid request"
// @Failure      401         {object}  DataTypes.Response "Unauthorized"
// @Failure      404         {object}  DataTypes.Response "Document not found"
// @Failure      500         {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/documents/{documentID} [delete]
// @Security BearerAuth
func DeleteDocument(c *fiber.Ctx) error {
	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	documentID := c.Params("documentID")

	if xStoreID == "" || documentID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID or document ID",
		})
	}

	// Delete document
	response, err := DocumentService.DeleteDocument(xStoreID, documentID, userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(DataTypes.Response{
			Status:  404,
			Message: "Failed to delete document: " + err.Error(),
		})
	}

	return c.JSON(DataTypes.DocumentResponseWrapper{
		Status:  200,
		Message: response.Message,
		Data:    *response,
	})
}

// BulkDocumentOperations godoc
// @Summary      Bulk document operations
// @Description  Performs bulk insert, update, upsert, or delete operations on documents. Each document can specify its own action. If same hash is generated for multiple documents, they will be treated as the same document.
// @Tags         Store Documents
// @Accept       json
// @Produce      json
// @Param        xStoreID  path      string                         true  "X-Store ID"
// @Param        body      body      DataTypes.BulkDocumentRequest  true  "Bulk operation data"
// @Success      200       {object}  DataTypes.BulkDocumentResponseWrapper "Bulk operation completed"
// @Failure      400       {object}  DataTypes.Response "Invalid request"
// @Failure      401       {object}  DataTypes.Response "Unauthorized"
// @Failure      404       {object}  DataTypes.Response "Store not found"
// @Failure      500       {object}  DataTypes.Response "Internal server error"
// @Router       /admin/Stores/{xStoreID}/documents/bulk [post]
// @Security BearerAuth
func BulkDocumentOperations(c *fiber.Ctx) error {
	// Get user ID from authentication
	userID, err := middlewares.GetUserID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(DataTypes.Response{
			Status:  401,
			Message: "Unauthorized: Unable to retrieve user ID",
		})
	}

	xStoreID := c.Params("xStoreID")
	if xStoreID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid x-store ID",
		})
	}

	var req DataTypes.BulkDocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "Invalid request body: " + err.Error(),
		})
	}

	if len(req.Documents) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(DataTypes.Response{
			Status:  400,
			Message: "At least one document is required",
		})
	}

	// Process bulk operations
	response, err := DocumentService.BulkOperations(xStoreID, req, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(DataTypes.Response{
			Status:  500,
			Message: "Failed to process bulk operations: " + err.Error(),
		})
	}

	message := fmt.Sprintf("Bulk operation completed: %d successful, %d failed out of %d total",
		response.SuccessCount, response.ErrorCount, response.TotalCount)

	return c.JSON(DataTypes.BulkDocumentResponseWrapper{
		Status:  200,
		Message: message,
		Data:    *response,
	})
}

// getUserOrgID fetches the organization ID for a given user ID
func getUserOrgID(userID int) (int, error) {
	// This function should be shared across routes, but for now we'll duplicate it
	// In the future, consider moving this to a shared utility package
	var orgID int
	err := db.GetDB().QueryRow(SELECT orgid FROM muser WHERE not isdeleted and userid = $1, userID).Scan(&orgID)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch user organization: %w", err)
	}
	return orgID, nil
}

// StoreRoutes sets up all store-related API routes
func StoreRoutes(app fiber.Router) {
	app.Get("/", middlewares.JWTMiddleware, GetAllStores) // Remove OrgId parameter and add JWT middleware
	app.Get("GetStore/:xStoreID", GetStoreByXStoreID)
	app.Get("/:xStoreID/credentials", middlewares.JWTMiddleware, GetStoreCredentials)
	app.Post("/", CreateStore)
	app.Put("/:storeID", UpdateStore)
	app.Put("/UpdateStatus/:id/:status", UpdateStoreStatus)
	app.Put("/:xStoreID/config", middlewares.JWTMiddleware, UpdateStoreConfig)
	app.Get("/:xStoreID/config", middlewares.JWTMiddleware, GetStoreConfig)
	app.Get("/:xStoreID/config-schema", middlewares.JWTMiddleware, GetStoreConfigSchema)
	app.Get("/:xStoreID/defaults", middlewares.JWTMiddleware, GetStoreSchemaBasedDefaults)

	// Document management routes
	app.Get("/:xStoreID/documents", middlewares.JWTMiddleware, GetDocuments)
	app.Get("/:xStoreID/documents/:documentID", middlewares.JWTMiddleware, GetDocument)
	app.Post("/:xStoreID/documents", middlewares.JWTMiddleware, InsertDocument)
	app.Put("/:xStoreID/documents/:documentID", middlewares.JWTMiddleware, UpdateDocument)
	app.Delete("/:xStoreID/documents/:documentID", middlewares.JWTMiddleware, DeleteDocument)
	app.Post("/:xStoreID/documents/bulk", middlewares.JWTMiddleware, BulkDocumentOperations)

	// File upload route
	app.Post("/:xStoreID/upload", middlewares.JWTMiddleware, UploadDocument)
}