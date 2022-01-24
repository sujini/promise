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
        if(!called && this.state !==PENDING){
            onExecFunc(this.state);
            this.state=FULFILLED;
        }
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
    let results = [],
        rejectPromise = promises.find(prom=>prom.state==='rejected');

    function returnResult(onFunc){
        let definedLen = results.filter(res => res!==undefined).length;
                           
        if(definedLen===promises.length) {
            return definedLen>1?onFunc(results):onFunc(...results);
        }
    }
  
        
    function execFunc(resolve, reject) {
        
        if(promises.length==0)return resolve(promises); //주어진 순회 가능한 객체가 비어있는 경우에만 동기적으로 이행

        if(rejectPromise){//배열 내 요소 중 어느 하나라도 거부하면 즉시 거부             
            return rejectPromise.catch((error) => {
                reject(error);
            });
        }

 
            
        promises.forEach((promise, i) =>{
        
            if(promise.constructor === Promise2){
                promise.then((val) => {
                    results[i] = val;                                            
                    return returnResult(resolve);                        
                })
                .catch((error) => {
                    results[i] = error; 
                    return returnResult(reject);                        
                });
                
            }else{
                results[i] = promises[i];
                setTimeout(()=>{//async Promise객체가 아닐때
                    return returnResult(resolve);
                });
               
            }
        });
     
    }
    
    return new Promise2(execFunc);
    
    
};
