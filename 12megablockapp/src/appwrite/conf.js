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

    async createPost({title,slug,content,featuredimage,status,userid}){
        try {
            console.log(title,slug,content,featuredimage,status,userid)
            return await this.Databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                {
                    title:title, 
                    content:content,
                    featuredimage:featuredimage,
                    status:status,
                    userid:userid
                }
            );
        }    
         catch (error) {
           console.log(error);
        }
    }


     async updatePost(slug,data){
        try {
            return await this.Databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                data,
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

    async getPostsByUser(userid) {
    try {
        return await this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            [
                Query.equal('userid', userid),
                Query.equal('status', 'active') // optional: only active posts
            ]
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

   getfilepreview(fileId){
        console.log(fileId)
        const preview =this.Storage.getFileView(
            conf.appwriteBucketId,
            fileId,
        )
        console.log(preview)
        return preview;
    }

}

const services = new Services();
export default services;