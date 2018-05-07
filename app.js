const myScript = require('./script/scrap');
const express = require('express')
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const app = express()
const yearsUrl = "http://www.caa.gov.tw/big5/content/index.asp?sno=927"


app.use(express.static('views'))
app.use("/users", function(req, res, next){      
    console.log("users中介函式啟動");
    next(); 
});


app.get('/scrap', function(req, res) {
    setAirlinesLink();
    res.send('OK!')
})

const setAirlinesLink = function () {
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

      // console.log("***********");
      // console.log(yearsLink);
      // console.log("***********");

      // get all promise object
      var yearsStrArr = Object.keys(yearsLink);
      var yearsPromiseFunctionParseArr = [];
      var arrayLength = yearsStrArr.length;
      for (var yearIdx = 0; yearIdx < arrayLength; yearIdx++) {
        yearsPromiseFunctionParseArr.push(myScript.getPromiseYearContent(yearsLink, yearsStrArr[yearIdx]));
      }

      Promise.all(yearsPromiseFunctionParseArr).then((yearsMonthesJsonArray) => {
        // console.log("--------------------");
        // console.log(JSON.stringify(yearsMonthesJsonArray));
        // console.log("--------------------");
        mergeYearsMonthesJson(yearsLink, yearsMonthesJsonArray);
        // need merge to one json
      
      }).catch((err) => {
        console.log(err.message)
      })
    });




  };


// const mergeYearsMonthesJson = function(yearsLink, yearsMonthesJsonArray){
  

// }


app.listen(3000, () => console.log('Example app listening on port 3000!'))