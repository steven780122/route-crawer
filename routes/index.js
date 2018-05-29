const express = require('express');
const myScript = require('./scrap');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const yearsUrl = "http://www.caa.gov.tw/big5/content/index.asp?sno=927";
const allYearsDataFileName = "allYearsData.json";
const util = require('util');
const _ = require('lodash');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/scrap', function(req, res) {
  setScrapPromise().then((allYearsJson) => {
    res.send(allYearsJson);
  }).catch((err) => {
    res.send(err.toString());
  });
})

router.get('/downloadAll/', function(req, res) {
  // Add scrap first....
  setScrapPromise().then((allYearsJson) => {
    fs.writeFileSync(allYearsDataFileName, allYearsJson);   
    fs.stat(allYearsDataFileName, function(err, stat) {
      if(err == null) {
        try{
          console.log('File exists');
          var data = JSON.parse(allYearsJson);
          // download by promise
          var downloadPromiseArr = [];
          for(year in data){  
            for(month in data[year]["Data"]){
              console.log(month); 
              var downloadLink = data[year]["Data"][month]["link"];
              console.log(downloadLink);  
              var finalFileType = downloadLink.substr(downloadLink.lastIndexOf('.') + 1);
              var filename =  downloadLink.split('/').pop();
              var dest = './downloads/' + year + month + '.' + finalFileType;
              console.log('Downloading ' + filename);  
              checkDirectory('downloads');              
              downloadPromiseArr.push(downloadByPromise(encodeURI(downloadLink), dest));
            }
          }
    
          Promise.all(downloadPromiseArr).then((downLoadInfo) => {  
            console.log(downLoadInfo);  
          }).catch((err) => {
            console.log(err.message)
          });

        }catch(err){
          console.log(err);
          res.send(err.toString());
        }
      } else if(err.code == 'ENOENT') {
          // file does not exist
          fs.writeFile('log.txt', 'Some log\n');
      } else {
          console.log('Some other error: ', err.code);
      }
    });    
    res.send('Get file done.');
  }).catch((err) => {
    res.send(err.toString());
  });
})


// ex, /downloadByYearMonth/2011/10
router.get('/downloadByYearMonth/:year/:month', function(req, res) {
  var year = req.params.year;
  var month = req.params.month;

  // // scrap first....
  setScrapPromise().then((allYearsJson, err) => {   
    fs.stat(allYearsDataFileName, function(err, stat) {
      if(err == null) {
        try{
          console.log('File exists');          
          var data = JSON.parse(fs.readFileSync(allYearsDataFileName));
          var {downloadLink, dest} = processDownloadLink(data, year, month)
          downloadByFs2(encodeURI(downloadLink), dest);
          res.send('Get file done.');
        }catch(err){
          console.log(err);
          res.send(err.toString());
        }

      } else if(err.code == 'ENOENT') {
          // file does not exist
          fs.writeFile('log.txt', 'Some log\n');
          res.send("ENOENT");
      } else {
        console.log(err);
        res.send(err.toString());    
      }
    });
  }).catch((err) => {
    res.send(err.toString());
  });
})


router.get('/downloadNewData', function(req, res){
  getNewerData();
  res.send("OK");
});


// only scrap without writing file
const setScrapPromise = function(){
  return new Promise(function (resolve, reject) {
    Promise.all([setAirlinesLink()]).then((getData) => {
      allYearsJson = getData;

      resolve(allYearsJson);
    }).catch((err) => {
      console.log(err.message)
      reject(err);
    });
  })
}


const setAirlinesLink = function () {
  return new Promise(function (resolve, reject) {
    var allYearsJson = {};  
      request({
        url: yearsUrl, 
        method: "GET"
      }, function (error, response, body) {
        if (error || !body) {
          console.log(error);
          return;
        }
        const $ = cheerio.load(body, {decodeEntities: false}); // 載入 body     
        var yearsLink = myScript.getYearsLink($);
        // get all promise object
        var yearsStrArr = Object.keys(yearsLink);
        var yearsPromiseFunctionParseArr = [];
        var arrayLength = yearsStrArr.length;
        for (var yearIdx = 0; yearIdx < arrayLength; yearIdx++) {
          yearsPromiseFunctionParseArr.push(myScript.getPromiseYearContent(yearsLink, yearsStrArr[yearIdx]));
        }

        Promise.all(yearsPromiseFunctionParseArr).then((yearsMonthesJsonArray) => {
          // need merge to one json
          allYearsJson = mergeYearsMonthesJson(yearsLink, yearsMonthesJsonArray);
          resolve(allYearsJson);
        }).catch((err) => {
          console.log(err.message)
        })
      });
    });
  };

  
const mergeYearsMonthesJson = function(yearsLink, yearsMonthesJsonArray){
  var finalYearsDataDict = {};
  var arrayLength = yearsMonthesJsonArray.length;
  // merge json array
  for (var yearIdx = 0; yearIdx < arrayLength; yearIdx++) {
    Object.assign(finalYearsDataDict, yearsMonthesJsonArray[yearIdx]);
  }
  finalYearsDataDict = mergeDict(finalYearsDataDict, yearsLink);

  return JSON.stringify(finalYearsDataDict);
}

const mergeDict = function(a, b) {
  for (var key in b) {
      try {
        if (b[key].constructor === Object) {
            a[key] = mergeDict(a[key], b[key]);
        } else {
            a[key] = b[key];
        }
      } catch(e) {
          a[key] = b[key];
      }
  }
  return a;
}


// download by promise
const downloadByPromise = function(url, dest){
  return new Promise(function (resolve, reject) {
    try{
      request.get(url)
      .on('error', function(err) {
        console.log(err);  
        console.log('Unfinishing Downloading ' + dest);
        reject(dest + " promise fail!");
      })
      .pipe(fs.createWriteStream(dest))
      .on('close', function(){
        console.log('Finished Downloading ' + dest);
      });
      resolve(dest + " OK!");
    }catch(err){
      console.log(err);
      reject(dest + " promise fail!");
    }
  })
}


const processDownloadLink = function(newerData, year, month){
  var downloadLink;
  var dest;
  try{
    downloadLink = newerData[year]["Data"][month]["link"];
    console.log(downloadLink);  
    var finalFileType = downloadLink.substr(downloadLink.lastIndexOf('.') + 1);
    var filename =  downloadLink.split('/').pop();
    dest = './downloads/' + year + month + '.' + finalFileType;
    console.log('Downloading ' + filename);  
  }catch(err){
    console.log(err);
  }
  
  return {downloadLink:downloadLink, dest:dest};
}


// by fs
const downloadByFs2 = function(url, dest){
  try{
    request.get(url)
    .on('error', function(err) {console.log(err)} )
    .pipe(fs.createWriteStream(dest))
    .on('close', function(){console.log('Finished Downloading' + dest)});
  }catch(err){
    console.log(err);
  }
};


const getNewerData = function(){
  var newerData = {};
  // scrap all and set new file
  var resultData = {}; 
  var oriYearsData = {};
  setScrapPromise().then((allYearsJson) => {
    oriYearsData = JSON.parse(fs.readFileSync(allYearsDataFileName));
    resultData = JSON.parse(allYearsJson);;
    fs.writeFileSync(allYearsDataFileName, allYearsJson);   // write json file
  }).then(function(){   
    // handle diff json obj
    var oriYearsDataLoss = oriYearsData;  
    var newerData = getDiffData(oriYearsData, resultData);
    downloadByNewerData(newerData);
  }).catch((err) => {
    console.log(err);
    return err;
  });
  return newerData;
}


// get two json diff 
const getDiffData = function(oriData, scrapData){
  var oriDataTemp = oriData;  
  var scrapDataTemp = scrapData;
  try{
    Object.keys(oriDataTemp).forEach(function(yearKey) {
      if(_.isEqual(oriDataTemp[yearKey], scrapDataTemp[yearKey])){
        delete scrapDataTemp[yearKey];
      }else{
        // if not the same
        Object.keys(oriDataTemp[yearKey]["Data"]).forEach(function(monthKey) {
          if(oriDataTemp[yearKey]["Data"].hasOwnProperty(monthKey)){
            delete scrapDataTemp[yearKey]["Data"][monthKey];
          }
        })      
      }
    })
  }catch(err){
    console.log(err);
  }
  
  // console.log(util.inspect(scrapDataTemp, false, null))
  return scrapDataTemp;
}


// download by newer json obj
const downloadByNewerData = function(newerData){
  try{
    var downloadPromiseArr = [];
    for(year in newerData){  
      for(month in newerData[year]["Data"]){
        console.log(month); 
        // var downloadLink = newerData[year]["Data"][month]["link"];
        // console.log(downloadLink);  
        // var finalFileType = downloadLink.substr(downloadLink.lastIndexOf('.') + 1);
        // var filename =  downloadLink.split('/').pop();
        // var dest = './downloads/' + year + month + '.' + finalFileType;
        // console.log('Downloading ' + filename);  
        var {downloadLink, dest} = processDownloadLink(newerData, year, month)
        downloadPromiseArr.push(downloadByPromise(encodeURI(downloadLink), dest));
      }
    }

    Promise.all(downloadPromiseArr).then((downLoadInfo) => {  
      console.log(downLoadInfo);  
    }).catch((err) => {
      console.log(err.message)
    });
  }catch(err){
    console.log(err);
  }
};


const checkDirectory = function(path){       
  if (!fs.existsSync(path)){
    fs.mkdirSync(path);
  }
}

module.exports = router;
