
const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const s3 = new AWS.S3();

const puppeteer = chromium.puppeteer;
const API_KEY = 'InstantLayout-apiKey-nr4nxwrrDccw44b3S3DD3Scx2Aalrx';
const EXPORTS_BUCKET = 'exports.instantlayout.com';



exports.handler = async (event) => {

    let body = JSON.parse(event.body);
    let statusCode = '200';
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        body = await checkRequest(body);
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



async function checkRequest({ aliasId, apiKey, project, user }) {
    if (apiKey === API_KEY && aliasId && project && user) {
        return await getDimensions(aliasId, project, user);
    }
    return {
        errorMessage: 'There was a problem with the api kay, project name, or user.',
        successMessage: null
    };
}



async function getDimensions(aliasId, project, user) {

    // TODO: GET DIMS FROM EXPORTS-DB

    const height = 800;
    const width = 1200;
    return await renderImage(height, project, user, width);
}



async function renderImage(aliasId, height, project, user, width) {
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { height, width },
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true
    });
    const page = await browser.newPage();
    await page.setCookie({ name: 'aliasId', value: aliasId, domain: 'instantlayout.com', secure: true });
    await page.setCookie({ name: 'export', value: project, domain: 'instantlayout.com', secure: true });
    await page.goto('https://instantlayout.com/export', { waitUntil: 'networkidle2' });
    // await page.waitFor(360000); // 3 min render time

    // HERE IS GOOD I THINK, GETTING EPORTS TO WORK AGAIN

    const buffer = await page.screenshot();
    await saveToExportsBucket(aliasId, buffer, project, user);
}



async function saveToExportsBucket(aliasId, buffer, project, user) {

    // return {
    //     errorMessage: 'DD, MAKE IT HERE?',
    //     successMessage: height + ' ' + width
    // };

    try {
        const params = {
            Bucket: EXPORTS_BUCKET,
            Key: `${user}/${aliasId}/${project}.png`,
            Body: buffer,
            ContentType: 'image'
        };
        const putResult = await s3.putObject(params).promise();
        // TODO: update dynamo record from here
        return {
            errorMessage: null,
            successMessage: 'Export has been rendered and saved.'
        };
    } catch (error) {
        return {
            errorMessage: 'Error: ' + error,
            successMessage: null
        };
    }
}
