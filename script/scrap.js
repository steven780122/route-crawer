const fs = require('fs')
const cheerio = require('cheerio');
const request = require('request')
const uniqueYearBaseUrl = "http://www.caa.gov.tw/big5/content/"
const uniqueMonthBaseUrl = "http://www.caa.gov.tw/"

var self = module.exports = {
    getYearsLink: function($) {
        var yearLinks = new Object();
        console.log("5");
        // get links for years
        links = $('td > strong > a'); 
        var _ = this;
        $(links).each(function(i, link){   
            var yearLinkData = new Object();
            year = $(link).text();
            // clean space
            year = year.replace(/\s/g, '');   
            year = _.setMinguoToCommonYear(year.replace('年', ''));
            yearLink = $(link).attr('href');
            yearLinkData['link'] = uniqueYearBaseUrl + yearLink;
            yearLinks[year] = yearLinkData;
        });

        return yearLinks;
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
            excelLink = uniqueMonthBaseUrl + excelLink.replace("../../", "");
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
 