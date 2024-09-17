import { storage } from "../firebase-config";
import { FormData } from "./tokencreator";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export async function getjsonuri(data: FormData, uploadedImageUrl: string | null): Promise<string> {
    const metadataJson = {
        name: data.tokenName,
        symbol: data.tokenSymbol,
        description: data.description,
        image: uploadedImageUrl || '',
        attributes: [],
        properties: {
            files: uploadedImageUrl ? [{ uri: uploadedImageUrl, type: "image/png" }] : [],
        },
        links: {
            website: data.website,
            twitter: data.twitter,
            telegram: data.telegram,
            discord: data.discord
        }
    };

    // Generate a unique identifier for the metadata file
    const metadataId = `${data.tokenSymbol}-${Date.now()}`;

    try {
        const metadataUri = await uploadMetadata(metadataJson, metadataId);
        console.log('Metadata uploaded successfully!');
        console.log('Metadata URI:', metadataUri);
        return metadataUri;
    } catch (error) {
        console.error('Error uploading metadata:', error);
        throw error;
    }
}

async function uploadMetadata(metadata: any, metadataId: string): Promise<string> {
    
    const metadataRef = ref(storage, `token-metadata/${metadataId}.json`);
    
    try {
        // Upload string data
        await uploadString(metadataRef, JSON.stringify(metadata), 'raw', {
            contentType: 'application/json',
        });
        
        // Get the download URL
        const downloadURL = await getDownloadURL(metadataRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading metadata:', error);
        throw error;
    }
}