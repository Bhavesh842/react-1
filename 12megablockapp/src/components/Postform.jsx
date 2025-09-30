import React, { use, useCallback ,useEffect} from 'react'
import RTE from './RTE'
import {useForm} from 'react-hook-form'
import Button from './Button'
import Input from './Input'
import Select from './Select'
import services from '../appwrite/conf'
import {useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'

function Postform({post}) {
    console.log('postformcomponentPost',post)
    console.log('postformcomponentPostId',post?.$id)
    const {register,handleSubmit,watch,getValues,setValue,control}= useForm({
        defaultValues:{
            title: post?.title || "",
            content: post?.content || "",
            status: post?.status || "active",
             slug: post?.$id || "",
             
        }
    });
    const navigate = useNavigate();
    const userdata = useSelector(state=>state.auth.userdata);
    console.log(userdata)

    const slugtransform =useCallback((value)=>{
        if(value){
            return value
            .toLowerCase()
             .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");

        }
    },[]);

    const submit =async(data)=>{
        console.log(data)
        if(post){
            const file = data.image && data.image[0] ? await services.uploadfile(data.image[0]) : null;

           

           if(file){
            await services.deletefile(post.featuredimage);
           }
           console.log(data)

           const dbpost = await services.updatePost(post.$id,{
            title:data.title,
            content:data.content,
            status:data.status,

            featuredimage: file ? file.$id : undefined,
        })
        if(dbpost){
            navigate(`/post/${dbpost.$id}`);

        }
    }else{
          const file = await services.uploadfile(data.image[0]);
        console.log(file)
        if(file){
            data.featuredimage = file.$id;
            console.log(file.$id)
            console.log(data.featuredimage)
            const dbpost = await services.createPost({...data,
                userid:userdata.$id,
               
             
            })
            if(dbpost){
                navigate(`/post/${dbpost.$id}`);
            }

    }

        
           
    }
   }

   useEffect(()=>{ 
    const subscription = watch((value,{name,})=>{
        if(name==="title"){
            setValue("slug",slugtransform(value.title,{shouldValidate:true}));
        }
    });
    return ()=>subscription.unsubscribe();

    },[watch, slugtransform, setValue])

  return (
     <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugtransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { required: !post })}
                />
                {post && (
                    <div className="w-full mb-4">
                        <img
                            src={services.getfilepreview(post.featuredimage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: true })}
                />
                <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
                    {post ? "Update" : "Submit"}
                </Button>
            </div>
        </form>
  )
}

export default Postform