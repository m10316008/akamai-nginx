import { Behavior } from '../behavior.js';

export class BehaviorCpCode extends Behavior {

    constructor(options, valueMap) {
        super();
        this.options = options;
        this.valueMap = valueMap;
    }

    process() {
        // just setting a response header for now.
        return 'ngx.header["x-aka-cpCode"] = "' +
            this.options.value.id + ' ' + this.options.value.name.replace(' ', '_') + '"';
    }
}
Behavior.register('cpCode', BehaviorCpCode);
