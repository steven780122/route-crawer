const fs = require('fs')
const cheerio = require('cheerio');
const request = require('request')
const uniqueYearBaseUrl = "http://www.caa.gov.tw/big5/content/"
const uniqueMonthBaseUrl = "http://www.caa.gov.tw/"

var self = module.exports = {
    getYearsLink: function($) {
        
    },


    // promise sample
    getPromiseYearContent: function (yearsLinks, year) {
        
        
    },

    getYearExcelLinkDict: function(yearLinks, yearStr){
        var excelLink = '';
        // console.log('8');
        // console.log(yearLinks);
        var monthesData = {};
        var finalYearData = {};

        // loop every month
        var arrayLength = yearLinks.length;
        for (var i = 0; i < arrayLength; i++) {
            var matchDateReg = /(\d+)年(\d+)月/g;
            var matchDate = matchDateReg.exec(yearLinks[i]);
            if (!matchDate){
                continue
            }
            
            var year = matchDate[1];
            var month = matchDate[2];
            if (month.length == 1){
                month  = '0' + month;
            }
            var linksArr = yearLinks[i].match(/(?<=\[).+?(?=\])/g);            
            var linksLength = linksArr.length;
            var excelArr = []
            for (var linkInx = 0; linkInx < linksLength; linkInx++) {
                if(linksArr[linkInx].includes('Excel')){
                    excelArr.push(linksArr[linkInx]);
                }
            }
            var excelArrLength = excelArr.length;
            var excelRawLink;
            if(excelArrLength == 1){
                excelRawLink = excelArr[0];
            }else{
                // if there are two excel links within a month
                for (var excelInx = 0; excelInx < excelArrLength; excelInx++) {
                    if(excelArr[excelInx].includes('Excel') &&  excelArr[excelInx].includes('下')){
                        excelRawLink = excelArr[excelInx];
                        break
                    }
                }
            }

            // fetch href value 
            var matchLinkRaw = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
            var matchLink = matchLinkRaw.exec(excelRawLink);
            excelLink = matchLink[1];
            excelLink = uniqueMonthBaseUrl + excelLink.replace(/\.\.\//g, "");
            var monthLink = {};
            monthLink.link = excelLink;
            monthesData[month] = monthLink;
        }
        var monthesData2 = {};
        monthesData2["Data"] = monthesData;
        finalYearData[this.setMinguoToCommonYear(year)] = monthesData2;
 
        return finalYearData;        
    },

    setMinguoToCommonYear(mingguoYear){
        return (parseInt(mingguoYear) + 1911).toString();
    }
 }
 