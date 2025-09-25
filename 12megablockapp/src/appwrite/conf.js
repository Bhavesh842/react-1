import conf from "../config/config";
import { Client, Account,ID ,Storage,Databases, Query} from "appwrite";


class Services{
      Client=new Client();
    
    Databases;
    Storage;

    constructor(){
        this.Client
        .setEndpoint(conf.appwriteUrl) // Your Appwrite Endpoint
        .setProject(conf.appwriteProjectId);

        this.Databases = new Databases(this.Client);
        this.Storage = new Storage(this.Client);
    }

    async createPost(title,slug,content,fetauredimage,status,userid){
        try {
            return await this.Databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                {
                    title:title, 
                    content:content,
                    fetauredimage:fetauredimage,
                    status:status,
                    userid:userid
                }
            );
        }    
         catch (error) {
           console.log(error);
        }
    }


     async updatePost(title,slug,content,fetauredimage,status,){
        try {
            return await this.Databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                {
                    title:title, 
                    content:content,
                    fetauredimage:fetauredimage,
                    status:status,
                   
                }
            );
        }    
         catch (error) {
           console.log(error);
        }
    }

    async deletePost(slug){
        try {
             await this.Databases.deleteDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            );
            return true;
        }    
         catch (error) {
           console.log(error);
        }
        return false;
    }

    async getpost(slug){
        try {
            return await this.Databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug
            );
            
        } catch (error) {
            
        }
        return false;
    }

    async getAllPosts(){
        try {
            return await this.Databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                [ Query.equal('status', 'active') ]
            );
        } catch (error) {
            console.log(error);
        }
    }


    //upload file

    async uploadfile(file){
        try {
            return await this.Storage.createFile(
                conf.appwriteBucketId,
                ID.unique(),
                file
            )
            
        } catch (error) {
            console.log(error);
        }
    }


    async deletefile(fileId){
        try {
            return await this.Storage.deleteFile(
                conf.appwriteBucketId,
                fileId
            )
            
        } catch (error) {
            console.log(error);
        }
    }

    async getfilepreview(fileId){
        try {
            return this.Storage.getFilePreview(
                conf.appwriteBucketId,
                fileId,
            )

        } catch (error) {
            console.log(error);
        }
    }

}

const services = new Services();
export default services;