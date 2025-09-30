import conf from "../config/config";
import { Client, Account,ID } from "appwrite";

class AuthService {
    Client=new Client();
    account;

    constructor(){
        this.Client
        .setEndpoint(conf.appwriteUrl) // Your Appwrite Endpoint
        .setProject(conf.appwriteProjectId);

        this.account = new Account(this.Client);
    }

    async createAccount(email, password,name) {
        try{
            const userId    = ID.unique();
            console.log(userId)
        const useraccount =await this.account.create(userId, email, password,name);
        
        if(useraccount){
           return this.login(email,password);
        }
            else{
               
                return useraccount;
            }

        }
        catch(err){
            throw err;
            console.log(err);
        }
    }

    async login(email,password){
        try {
            return await this.account.createEmailPasswordSession(email, password);
            
        } catch (error) {
            throw error;
        }
    }

    async getcurrentUser(){
        try {
            const currentUser= await this.account.get();
            if(currentUser){
                return currentUser;
            }
            else{
                return null;
            }
            
        } catch (error) {
            throw error;
            
        }
    }

    async logout(){
        try {
            return await this.account.deleteSession('current');
        } catch (error) {
            throw error;
        }
    }


}

const authService = new AuthService();
export default authService;