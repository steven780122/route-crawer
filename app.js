const myScript = require('./script/scrap');
const express = require('express')
const cheerio = require('cheerio')
const request = require('request')
const http = require('http')
const fs = require('fs')

const wget = require('node-wget');
const exec = require('child_process').exec;  
const app = express()
const yearsUrl = "http://www.caa.gov.tw/big5/content/index.asp?sno=927"
const allYearsDataFileName = "allYearsData.json"


app.use(express.static('views'))
app.use("/users", function(req, res, next){      
    console.log("users中介函式啟動");
    next(); 
});


app.get('/download/', function(req, res) {
  var year = "2018";
  var month = "01";

  fs.stat(allYearsDataFileName, function(err, stat) {
    if(err == null) {
      console.log('File exists');
      var data = JSON.parse(fs.readFileSync(allYearsDataFileName));
      // console.log(JSON.stringify(data));
      var downloadLink = data[year]["Data"][month]["link"]

      console.log(data[year]["Data"][month]["link"]);
      // download(downloadLink, './test.xls');
      download_file_wget(encodeURI(downloadLink), './downloads/test');

      res.send('Get file done.');
    } else if(err.code == 'ENOENT') {
        // file does not exist
        fs.writeFile('log.txt', 'Some log\n');
    } else {
        console.log('Some other error: ', err.code);
    }
});

})


var download_file_wget = function(file_url, DOWNLOAD_DIR) {    
  wget({
      url:  file_url,
      dest: DOWNLOAD_DIR,      // destination path or path with filenname, default is ./
      timeout: 2000       // duration to wait for request fulfillment in milliseconds, default is 2 seconds
    }, function(err, data) {        // data: { headers:{...}, filepath:'...' }
    console.log('--- dry run data:');
    console.log(data); // '/tmp/package.json'
    }
  );
};  





// ori
// const download = function(url, dest, cb) {
//   var file = fs.createWriteStream(dest);
//   var request = http.get(url, function(response) {
//     response.pipe(file);
//     file.on('finish', function() {
//       file.close(cb);  // close() is async, call cb after close completes.
//     });
//   }).on('error', function(err) { // Handle errors
//     fs.unlink(dest); // Delete the file async. (But we don't check the result)
//     if (cb) cb(err.message);
//   });
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
    // res.send('Scrape done!!');
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
          console.log("2");
          console.log(error);
          return;
        }
        console.log("3");
        const $ = cheerio.load(body, {decodeEntities: false}); // 載入 body     
        console.log("4");
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

  // console.log("****************")
  // console.log(JSON.stringify(finalYearsDataDict));

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