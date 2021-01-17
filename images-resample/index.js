
// [DONE] fields in body
// [DONE] check if s3 exports file exists
// [DONE] resample down
// [DONE] save to GEG/assets/ + products & thumbnails
// [DONE] add logo
// TODO: add label

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');
sharp.cache(false);
sharp.concurrency(1);

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
        const result = await resample(project, user, originalImage, 'products', 800);
        if (result.successMessage) {
            return await resample(project, user, originalImage, 'thumbnails', 400);
        }
        return result;
    } catch(error) {
        return {
            errorMessage: 'Error: ' + error,
            successMessage: null
        };
    }
}



async function resample(project, user, originalImage, folder, width) {
    try {
        const buffer = await sharp(originalImage.Body)
            .resize(width)
            .extend({
                background: { r: 0, g: 0, b: 0, alpha: 1 },
                bottom: width / 8,
                left: 0,
                right: 0,
                top: 0
            })
            .composite([{
                input: folder + '-brand.png',
                left: 0,
                top: width * 1.5
            }])
            .sharpen()
            .jpeg({
                quality: 95,
                chromaSubsampling: '4:4:4'
            })
            .toBuffer();
        const kabobFileName = project.toLowerCase().replace(/\s/g, '-') + '.jpg';
        try {
            const params = {
                Bucket: GEG_BUCKET,
                Key: 'assets/' + folder + '/' + kabobFileName,
                Body: buffer,
                ContentType: "image"
            };
            const putResult = await s3.putObject(params).promise();
            return {
                errorMessage: null,
                successMessage: 'Export has been resized and saved.'
            };
        } catch (error) {
            return {
                errorMessage: 'Error: ' + error,
                successMessage: null
            };
        }
    } catch (error) {
        return {
            errorMessage: 'Error: ' + error,
            successMessage: null
        };
    }
}
