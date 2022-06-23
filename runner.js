const newman = require('newman');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require("fs");

class NewmanRunner{
    constructor(reportsFolder = './temp_reports') {
        if(reportsFolder.endsWith('/'))
            reportsFolder = reportsFolder.slice(0, -1);
        this.reportsFolder = reportsFolder;
    }

    runCollection(res, reporter, collection, iterationData){
        const runSettings = this.buildRunSetting(reporter, collection, iterationData);
        newman.run(
            runSettings, 
            (err, summary) => this.sendCollectionResult(reporter, res, err, summary, runSettings)
        );
    }

    buildRunSetting(reporter, collection, iterationData){
        switch (reporter) {
            case 'html':
                const uniqueFileName = this.reportsFolder+'/htmlResults'+uuidv4()+'.html';
                return {
                    collection: collection,
                    iterationData: iterationData,
                    reporters: 'html',
                    reporter : { html : { export : uniqueFileName } }
                };
            case 'json':
                return {
                    collection: collection,
                    iterationData: iterationData
                };
            default:
            throw 'Reporter type is unknown: '+reporter+". Only html and json are supported"; 
        }
    }

    sendCollectionResult(reporter, res, err, summary, runSettings){
        if(err){
            console.error(err);
            res.status(500);
            res.send({error:""+err});
            return;
        }

        switch (reporter) {
            case 'html':
                const uniqueFileName = ""+runSettings.reporter.html.export;
                var options = {
                    root: path.join(__dirname)
                };
                res.sendFile(uniqueFileName, options, () =>fs.unlinkSync(uniqueFileName));
                break;
            case 'json':
                res.send(summary.run);
                break;
            default:
            throw 'Reporter type is unknown: '+reporter+". Only html and json are supported"; 
        }
    }

    purgeOrCreateReportFolder(){   
        if(fs.existsSync(this.reportsFolder)){
            fs.readdir(this.reportsFolder, (err, files) => {
                if (err) throw err;
                
                for (const file of files) {
                    fs.unlinkSync(this.reportsFolder+'/'+file);
                }
            });
            console.log(`Temporary report folder purged :${this.reportsFolder}`);
        }else{
            fs.mkdir(this.reportsFolder, (err) =>{
                if (err) throw err;
                console.log(`Temporary report folder created :${this.reportsFolder}`);
            })
        }
    }
}

module.exports = {NewmanRunner};