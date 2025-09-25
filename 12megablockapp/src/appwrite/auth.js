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

    async createAccount(email, password) {
        try{
        const useraccount =await this.account.create(ID.unique(), email, password);
        if(useraccount){
            this.login(email,password);
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
            return await this.account.createSession(email, password);
            
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
            return await this.account.deleteSession();
        } catch (error) {
            throw error;
        }
    }


}

const authService = new AuthService();
export default authService;