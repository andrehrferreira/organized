/**
 * Organized module application
 *
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

const fs = require("fs"),
      path = require("path"),
      glob = require("glob");

class Organized {
    /**
     * Contructor function
     * @return void
     */
    constructor (stg = {}){
        this.args = {};
        this.stgs = {};
    }

    /**
     * Function to set virtual variable
     * @param string key
     * @param mixed value
     * @return void
     */
    set(key, value){
        this.args[key] = value;
    }

    /**
     * Function to get virtual variable
     * @param string key
     * @return mixed
     */
    get(key){
        return (this.args[key]) ? this.args[key] : null;
    }

    /**
     * New load function replaces the config() function
     *
     * @param object dependencies
     * @param object params
     * @param object opts
     * @return object
     */
    load(dependencies = {},  params = {}, opts = {}){
        var _this = {
            /**
             * Function to get dependencies on function
             *
             * @param string name
             * @param function fn
             * @param integer pointer
             */
            call: function(name, fn, pointer){
                if(typeof fn == "function"){
                    if(fn.toString().length > 0){
                        var dependencesFn = [], lack = [];

                        if(/.*?function\s*?\(.*?\).*?/i.test(fn.toString().split("\n")[0]))
                            var funcArgs = fn.toString().split("\n")[0].match(/.*?function\s*?\((.*?)\).*?/i)[1].split(",");
                        else if(/.*?\(.*?\)\s*?=>\s*?{.*?/i.test(fn.toString().split("\n")[0]))
                            var funcArgs = fn.toString().split("\n")[0].match(/.*?\((.*?)\)\s*?=>\s*?{.*?/i)[1].split(",");

                        if(funcArgs){
                            for(var key in funcArgs){//Fix spaces
                                if(trim(funcArgs[key]) !== "" && trim(funcArgs[key]) != undefined && trim(funcArgs[key]) != null)
                                    dependencesFn[key] = trim(funcArgs[key]);
                            }

                            if(dependencesFn.length > 0){
                                var dependencesArr = [];

                                for(var key in dependencesFn){
                                    if(this[dependencesFn[key]])
                                        dependencesArr.push(_this[dependencesFn[key]]);
                                    else if(dependencesFn[key] == "_this")
                                        dependencesArr.push(_this);
                                    else
                                        lack.push(dependencesFn[key]);
                                }

                                if(dependencesArr.length === dependencesFn.length){
                                    this[name] = fn.apply(_this, dependencesArr);
                                }
                                else{
                                    if(!pointer)
                                        pointer = 1;

                                    pointer++;

                                    if(pointer < 10)
                                        setTimeout((_this, name, fn, pointer) => { _this.call.apply(_this, [name, fn, pointer]); }, 300, _this, name, fn, pointer);
                                    else
                                        console.error("Could not load module", name, lack);
                                }
                            }
                            else{
                                this[name] = fn.apply(_this, null);
                            }
                        }
                        else{
                            console.error("Could not load module", name, funcArgs);
                        }
                    }
                }
            },

            /**
             * Function to set internal variable
             *
             * @param string name
             * @param mixed value
             * @return void
             */
            set: function(name, value){
                if(!this[name])
                    this[name] = value;
            }
        };

        ///Loading dependencies
        if(typeof dependencies === "object"){
            for(let keyDependencies in dependencies){
                switch(typeof dependencies[keyDependencies]){
                    case "string": _this[keyDependencies] = opts.require(dependencies[keyDependencies]); break;
                    case "function": _this.call(keyDependencies, dependencies[keyDependencies], 0); break;
                }
            };
        }

        if(typeof params.provider == "function")
            _this.call("provider", params.provider);

        if(typeof params.services == "function"){
            _this.call("services", params.services);
        }
        else if(typeof params.services == "object"){
            for(let keyServices in params.services)
                if(typeof params.services[keyServices] == "function")
                    _this.call("services", params.services[keyServices]);
        }

        if(typeof params.map == "object"){
            for(let keyMap in params.map){
                glob(params.map[keyMap], (er, files) => {
                    for(let keyFiles in files){
                        let r = opts.require(files[keyFiles]);

                        if(typeof r == "function")
                            _this.call("map", r);
                    }
                });
            }
        }

        if(typeof params.scope == "function")
            _this.call("scope", params.scope);

        return _this;
    }

    /**
     * Function to bootstrap application (Deprecated)
     *
     * @param array dependences
     * @param function onload
     * @return void
     */
    init(dependences = [], onload){
        if(typeof onload === "function"){
            var argsArr = [];

            for(let keyArgs in dependences)
                argsArr.push(this.args[dependences[keyArgs]]);

            onload.apply(this, argsArr);
        }
    }
}

/**
 * @see http://locutus.io/php/strings/trim/
 */
function trim(str, charlist) {
    var whitespace = [' ', '\n', '\r', '\t', '\f', '\x0b', '\xa0','\u2000',
                      '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
                      '\u2007', '\u2008', '\u2009', '\u200a', '\u200b', '\u2028',
                      '\u2029', '\u3000'].join('');

    var l = 0
    var i = 0
    str += ''

    if (charlist)
        whitespace = (charlist + '').replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^:])/g, '$1')


    l = str.length;

    for (i = 0; i < l; i++) {
        if (whitespace.indexOf(str.charAt(i)) === - 1) {
            str = str.substring(i)
            break;
        }
    }

    l = str.length;

    for (i = l - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === - 1) {
            str = str.substring(0, i + 1)
            break;
        }
    }

    return whitespace.indexOf(str.charAt(0)) === - 1 ? str : ''
}

module.exports = new Organized;
module.exports.load = new Organized().load;
