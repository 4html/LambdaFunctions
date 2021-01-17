
// [DONE] 1. fields in body
// [DONE] 2. check if s3 exports file exists
// 3. resample down
// 4. add label, logo
// 5. save to GEG/assets/products/ (repeat 3-6 for thumbnail too)

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');

const API_KEY = 'InstantLayout-apiKey-nr4nxwrrDccw44b3S3DD3Scx2Aalrx';
const EXPORTS_BUCKET = 'exports.instantlayout.com';
const GEG_BUCKET = 'greatearthgallery.com';
const PRODUCT_WIDTH = 800;
const PRODUCTS_PATH = 'assets/products';
const THUMBNAIL_WIDTH = 400;
const THUMBNAILS_PATH = 'assets/thumbnails';



exports.handler = async (event) => {

    let body = JSON.parse(event.body);
    let statusCode = '200';
    const headers = { 'Content-Type': 'application/json' };

    try {
        body = await checkProjectExists(body);
    } catch (err) {
        statusCode = '400';
        body = {
            errorMessage: err.message,
            successMessage: null
        };
    }

    return JSON.stringify({
        statusCode,
        body,
        headers
    });
};



async function checkProjectExists({ apiKey, project, user }) {
    if (apiKey === API_KEY && project && user) {
        return await checkFile(project, user);
    }
    return {
        errorMessage: 'There was a problem with the api kay, project name, or user.',
        successMessage: null
    };
}



async function checkFile(project, user) {
    try {
        const params = {
            Bucket: EXPORTS_BUCKET,
            Key: `${user}/${project}/${project}.png`
        };
        const originalImage = await s3.getObject(params).promise();
        return await resample(project, user, originalImage);
    } catch(error) {
        return {
            errorMessage: 'Error: ' + error,
            successMessage: null
        };
    }
}



async function resample(project, user, originalImage) {

    return {
        errorMessage: null,
        successMessage: 'TESTING'
    };



    // try {
    //     const buffer = await sharp(originalImage.Body).resize(PRODUCT_WIDTH).toBuffer();

    //     return {
    //         errorMessage: null,
    //         successMessage: 'SUCCESS - AFTER RESIZE!!'
    //     };


    // TODO:
    // const kabobFileName = project.toLowerCase().replace(/\s/g, '-');
    // // Upload the thumbnail image to the destination bucket
    // try {
    //     const destparams = {
    //         Bucket: dstBucket,
    //         Key: dstKey,
    //         Body: buffer,
    //         ContentType: "image"
    //     };

    //     const putResult = await s3.putObject(destparams).promise();

    // } catch (error) {
    //     console.log(error);
    //     return;
    // }


    // } catch (error) {
    //     return {
    //         errorMessage: 'Error: ' + error,
    //         successMessage: null
    //     };
    // }
}
