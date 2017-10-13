import { default as requireDir } from 'require-dir';
import { RuleAttribute } from './ruleAttribute.js';

export class Behavior extends RuleAttribute {

    constructor(name, options, valueMap) {
        super();
        return Behavior.create(name, options, valueMap);
    }

    process() {
        // override
    }

    getHeaderName(headerNameOption) {
        return '"' + (this.options[headerNameOption] === 'OTHER' ?
            this.options.customHeaderName : [headerNameOption]) + '"';
    }

    processHeaderOptions(luaMapName, comment, capture) {
        let headerName = this.switchByVal({
            'MODIFY': this.getHeaderName('standardModifyHeaderName'),
            'ADD': this.getHeaderName('standardAddHeaderName'),
            'REMOVE': this.getHeaderName('standardRemoveHeaderName'),
            'REGEX': this.getHeaderName('standardModifyHeaderName')
        }, '"' + this.options.customHeaderName + '"', this.options.action);


        let headerValue = this.switchByVal({
            'MODIFY': this.value(this.options.newHeaderValue),
            'ADD': this.value(this.options.headerValue),
            'REMOVE': 'nil',
            'REGEX': 'string.gsub(cs(' + luaMapName + '[' + headerName + ']), ' +
            this.value(this.options.regexHeaderMatch) + ', ' +
            this.value(this.options.regexHeaderReplace) + ')',
        }, 'nil', this.options.action);

        let lua = [];

        // capture header manipulations to apply after proxy pass as table mapping header to
        // action, value, search, replacement
        if (capture) {
            lua = [
                '-- ' + this.options.action + ' CAPTURE ' + comment,
                luaMapName + '[' + headerName + '] = { "' + this.options.action + '", ' +
                headerValue + ', ' +
                this.value(this.options.regexHeaderMatch) + ', ' +
                this.value(this.options.regexHeaderReplace) + ' }'];
        } else {
            lua = [
                '-- ' + this.options.action + ' ' + comment,
                luaMapName + '[' + headerName + '] = ' + headerValue
            ];
        }

        return lua;
    }

}

requireDir('./behaviors');