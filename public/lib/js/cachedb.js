


function getFromCache(key){
    var val= idbKeyval.get(key);

    return val;
}


function  setToCache(key,value) {

    idbKeyval.set(key,value).then(function () {

        console.log("set local cache",key,value.length);
    });
}
