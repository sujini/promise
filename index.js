function Promise2(execFunc) {

    const PENDING = 'pending';
    const FULFILLED = 'fulfilled';
    const REJECTED = 'rejected';
    this.state =  PENDING;
    let onFulfilled, onRejected, onCallback;
    let called = false;
    let value = this.value = undefined;
   
    const self = this;


    function resolve(val) {
        if (called || self.state!==PENDING) return;
        self.state = FULFILLED;
        value=val;
        if(typeof onFulfilled === "function"){
            onExecFunc(self.state);
        }else{
            self.value = value; 
        }

    }

    function reject(reason) {
        if (called || self.state!==PENDING) return;//self.state!==PENDING은 콜백 이후 오류 throw시 promise 이행을 위함
        self.state = REJECTED; 
        value=reason;
        if (typeof onRejected === "function") { 
           
            onExecFunc(self.state);
        }else{                       
            self.value = reason;
            setTimeout(()=>{   //async to return promise
                if(self.state===REJECTED)throw reason;
            },0);
            
        }
       
       
       
    }

    function onExecFunc(state){
        setTimeout(()=>{    //async   
            called = true;
            if (state===FULFILLED ) {                
                onFulfilled(value);                
            }else if (state===REJECTED ) {
                onRejected(value);
            }
            onCallback && onCallback();     
        },0);
    }


    this.then = function (...callback) {
        let state = this.state;
        if (callback.length === 1 && state===REJECTED) {     
            return this;
        }else{
            onFulfilled = callback[0];
            if (callback.length >1)onRejected = callback[1];
        }
        
        if(!called && state !==PENDING){
            this.state=FULFILLED;
            onExecFunc(state);
            this.value=undefined;
        }
        
        
        return this;
    };

    this.catch = function (callback) {
        onRejected = callback;
        return this;
    };
    this.finally = function(onFinally){
        onCallback = onFinally;
        return this;
    }

    try {           
        execFunc(resolve, reject);
    } catch (e) {
        reject(e);
       
    }
}

Promise2.resolve = (value) => {
    if (value.constructor === Promise2) {
        return value;
    } else if (value.then) {//thenable
        return new Promise2(value.then);
    } else if (typeof value === 'function') {
        return new Promise2(value);
    } else {
        return new Promise2((resolve) => resolve(value));
    }
}


Promise2.reject = (reason) => new Promise2((resolve, reject) => reject(reason));




Promise2.all = (promises) => {
    let booleanArr = [],
        results = [];

    function execFunc(resolve, reject) {
        promises.forEach((promise, i) =>{
           
            if(promise.constructor === Promise2){
                console.log(promise)
                promise.then((val) => {
                        booleanArr.push(true);
                        results[i] = val;
                        console.log(booleanArr)
                        if (booleanArr.length === promises.length) {
                            
                           
                            return booleanArr.filter(bool => bool===true).length>1?resolve(results):resolve(...results);
                        }
                    })
                    .catch((error) => {
                        return reject(error);
                    })
                
            }else{
                booleanArr.push(false); 
                results[i] = promises[i];
                return resolve(results);
            }
        });
    }
    return new Promise2(execFunc);
};
