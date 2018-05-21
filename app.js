const myScript = require('./script/scrap');
const express = require('express')
const cheerio = require('cheerio')
const request = require('request')
const http = require('http')
const fs = require('fs')
// const wget = require('node-wget');
const exec = require('child_process').exec;  
const app = express();
const yearsUrl = "http://www.caa.gov.tw/big5/content/index.asp?sno=927"
const allYearsDataFileName = "allYearsData.json"


app.use(express.static('views'))
app.use("/users", function(req, res, next){      
    console.log("users中介函式啟動");
    next(); 
});


app.get('/download/', function(req, res) {
  var year = "2016";
  var month = "02";

  // Add scrap first....


  fs.stat(allYearsDataFileName, function(err, stat) {
    if(err == null) {
      console.log('File exists');
      var data = JSON.parse(fs.readFileSync(allYearsDataFileName));

      // download by promise

      var downloadPromiseArr = [];
      for(year in data){
        console.log(year);
        console.log("********");  
        for(month in data[year]["Data"]){
          console.log(month); 
          var downloadLink = data[year]["Data"][month]["link"];
          console.log(downloadLink);
    
          var finalFileType = downloadLink.substr(downloadLink.lastIndexOf('.') + 1);
          var filename =  downloadLink.split('/').pop();
          var dest = './downloads/' + year + month + '.' + finalFileType;
          console.log('Downloading ' + filename);
          // downloadByFs2(encodeURI(downloadLink), dest, function(){console.log('Finished Downloading' + dest)});
          // downloadByFs2(encodeURI(downloadLink), dest);

          downloadPromiseArr.push(downloadByPromise(encodeURI(downloadLink), dest));
        }
      }

      // console.log(downloadByPromise);

      Promise.all(downloadPromiseArr).then((downLoadInfo) => {
        // need merge to one json   
        console.log(downLoadInfo);  
        res.send('Get file done.');
        // res.send('OK!')
      }).catch((err) => {
        console.log(err.message)
        res.send(err.message)
      });


      // for test
      // var downloadLink = data[year]["Data"][month]["link"];
      // console.log(downloadLink);

      // var finalFileType = downloadLink.substr(downloadLink.lastIndexOf('.') + 1);
      // var filename =  downloadLink.split('/').pop();
      // var dest = './downloads/' + year + month + '.' + finalFileType;
      // console.log('Downloading ' + dest);
      // // downloadByFs2(encodeURI(downloadLink), dest, function(){console.log('Finished Downloading' + dest)});
      // downloadByFs2(encodeURI(downloadLink), dest);
      // res.send('Get file done.');
    } else if(err.code == 'ENOENT') {
        // file does not exist
        fs.writeFile('log.txt', 'Some log\n');
    } else {
        console.log('Some other error: ', err.code);
    }
  });
})



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
        // resolve(dest + " resolve OK!");
      });
      // .on('close', function(){console.log('Finished Downloading' + dest)});


      resolve(dest + " OK!");
    }catch(err){
      console.log(err);
      reject(dest + " promise fail!");
    }
  })
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

// by wget 
// var download_file_wget = function(file_url, DOWNLOAD_DIR) {    
//   wget({
//       url:  file_url,
//       dest: DOWNLOAD_DIR,      // destination path or path with filenname, default is ./
//       timeout: 2000       // duration to wait for request fulfillment in milliseconds, default is 2 seconds
//     }, function(err, data) {        // data: { headers:{...}, filepath:'...' }
//     console.log('--- dry run data:');
//     console.log(data); // '/tmp/package.json'
//     }
//   );
// };  

app.get('/scrap', function(req, res) {
  var allYearsJson = {};  
  // allYearsJson = setAirlinesLink();
  Promise.all([setAirlinesLink()]).then((getData) => {
    // need merge to one json
    allYearsJson = getData;
    console.log("*******************")
    console.log(allYearsJson);

    fs.writeFileSync(allYearsDataFileName, allYearsJson);
    res.send(allYearsJson);
    // res.send('OK!')
  }).catch((err) => {
    console.log(err.message)
    res.send(err.message)
  });
  // res.send('OK!')
})


const setAirlinesLink = function () {
  return new Promise(function (resolve, reject) {
    var allYearsJson = {};  
    console.log("1");
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

app.listen(3000, () => console.log('Example app listening on port 3000!'))