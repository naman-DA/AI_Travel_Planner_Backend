import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import { ApiError } from "./ApiError.js";

// Upload File to Cloudinary

const uploadOnCloudinary = async(localFilePath, folder= "ai-travel-planner") => 
{
  try{
    if(!localFilePath){
      return null;
    }

    const response = await cloudinary.uploader.upload(
      localFilePath,
      {
        folder,
        resource_type: "auto",
      }
    );

    // Delete local file after successful upload

    fs.unlinkSync(localFilePath);

    return response;
  }

  catch(error){
    // Delete local file if upload fails

    if(localFilePath && fs.existsSync(localFilePath)){
      fs.unlinkSync(localFilePath);
    }

    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

// Delete file from Cloudinary

const deleteFromCloudinary = async(publicId) => {
  if(!publicId){
    return;
  }

  try{
    return await cloudinary.uploader.destroy(publicId);
  }

  catch(error){
    throw new ApiError(500, "Failed to delete file from Cloudinary");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };