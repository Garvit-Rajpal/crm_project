import { Query } from "mongoose";
import { users } from "../data/dummyData.js";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
const userResolver = {
    Query:{
        users:()=>{
            return users;
        },
        authUser: async(_,_,context)=>{
            try{
                const user = await context.getUser();
                return user;
            }
            catch(err){
                console.log("Error in authUser",err);
            }
        },
        user: async(_,{userId})=>{
            try{
                const user = await User.findById(userId);
                return user;
            }
            catch(err){
                console.log(err);
            }
        }

    },
    Mutation:{
        signUp: async(_,{input},context)=>{
            try{
                const {username,name,password,gender}=input;
                if(!username||!name||!password||!gender){
                    throw new Error("All Fields Required");
                }
                const existingUser = await User.findOne({username});
                if(existingUser){
                    throw new Error("User Already Exists");
                }
                const salt =bcrypt.genSalt(10);
                const hashedPassword = bcrypt.hash(password,salt);
                const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
				const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

                const newUser = new User({
                    username,
                    name,
                    password:hashedPassword,
                    gender,
                    profilePicture: gender === "M"?boyProfilePic:girlProfilePic
                })
                await newUser.save();
                await context.login(newUser);
                return newUser;


            }
            catch(err){
                console.log("error in signup: ",err);

            }

        },
        login: async(_,{input},context)=>{
            try{
                const {username,password}=input;
                if(!username||!password){throw new Error("All Fields Required")}
                const {user}=context.authenticate("graphql-local",{username,password});
                await context.login(user);
                return user;
            }
            catch(err){
                console.error("Error in login",err);

            }
        },
        logout: async (_, __, context) => {
			try {
				await context.logout();
				context.req.session.destroy((err) => {
					if (err) throw err;
				});
				context.res.clearCookie("connect.sid");

				return { message: "Logged out successfully" };
			} catch (err) {
				console.error("Error in logout:", err);
				throw new Error(err.message || "Internal server error");
			}
		},

    }
}

export default userResolver;