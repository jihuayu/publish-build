const twitchBase = "https://mirror.jihuayu.workers.dev/cfsvc/";
const axios = require("axios");
const fs = require("fs");
const path = require("path");
axios.defaults.retry = 4;
axios.defaults.retryDelay = 1000;

axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
    var config = err.config;
    // If config does not exist or the retry option is not set, reject
    if(!config || !config.retry) return Promise.reject(err);

    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if we've maxed out the total number of retries
    if(config.__retryCount >= config.retry) {
        // Reject with the error
        return Promise.reject(err);
    }

    // Increase the retry count
    config.__retryCount += 1;

    // Create new promise to handle exponential backoff
    var backoff = new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, config.retryDelay || 1);
    });

    // Return the promise in which recalls axios to retry the request
    return backoff.then(function() {
        return axios(config);
    });
});
axios.defaults.timeout =  20*1000;

f = async () => {
    for (let i = 0; i < 100; i++) {
        console.log(i);
        let res = await axios.get(twitchBase + `api/v2/addon/search?gameId=432&index=${100 * i}&pageSize=100&sort=1&sectionId=6`);
        for (let i of res.data){
            let addon = await axios.get(twitchBase+`api/v2/addon/${i.id}/files`);
            for(let j of addon.data){
                let re = /https:\/\/edge\.forgecdn\.net\/(.+)\/(.+)/gm.exec(j.downloadUrl);
                if(Math.random()<0.2)
                    await downloadFile(j.downloadUrl,path.join('mods',re[1]),re[2]);
                else
                    downloadFile(j.downloadUrl,path.join('mods',re[1]),re[2]);
            }
        }
    }
};

f();

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
async function downloadFile(url, filepath, name) {
    mkdirsSync(filepath);
    const mypath = path.resolve(filepath, name);
    const writer = fs.createWriteStream(mypath);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}
