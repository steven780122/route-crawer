const fs = require('fs')
const cheerio = require('cheerio');
const request = require('request')
const uniqueYearBaseUrl = "http://www.caa.gov.tw/big5/content/"
const uniqueMonthBaseUrl = "http://www.caa.gov.tw/";

const util = require('util');

var self = module.exports = {
    getYearsLink: function($) {
        console.log("1");
        links = $('font > a');
        // console.log(util.inspect($, false, null))
        // console.log($(""))
        // links = $('body > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td > table:nth-child(1) > tbody > tr:nth-child(1) > td > p > font:nth-child(492)')
        console.log(links['41']);
        console.log("2s");
        
    },


    // promise sample
    getPromiseYearContent: function (yearsLinks, year) {
        return new Promise(function (resolve, reject) {
            var yearLink = yearsLinks[year].link;;
            var yearData = yearData;     
            // console.log(test);
            request({
                url: yearLink, 
                method: "GET"
            }, function (error, response, body) {
                if (error || !body) {
                console.log("6");
                console.log(error);
                reject(error);
                } 

                // for test
                const $ = cheerio.load(body, {decodeEntities: false}); // 載入 body
                links = $('body > a > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(1) > td'); 
                monthsDataRaw = $(links).attr('id', 'forUpdate');
                testStr = monthsDataRaw.html();
                testStr = testStr.replace("<br>", "<br><p>");
                testStr = testStr.replace("<p></p>", "</p>");
                const yearLinks = [];
                var $2 = cheerio.load(testStr, {ignoreWhitespace: true, decodeEntities: false})
                links = $2('p')
                $2(links).each(function(i, elem) {
                    yearStr = $2(this).text();   
                    yearLinks[i] = $2(elem).html().replace(/\n/g, '');
                }); 
                var yearData = self.getYearExcelLinkDict(yearLinks, yearStr);           
 
                resolve(yearData);
            });
            
        });
    },

    getYearExcelLinkDict: function(yearLinks, yearStr){
              
    },

    setMinguoToCommonYear(mingguoYear){
        return (parseInt(mingguoYear) + 1911).toString();
    }
 }
 