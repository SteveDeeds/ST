export function toEng(num, precision = 3) {
    if (num === 0) {
        return "0";
    }

    const prefixes = ["", "k", "M", "G", "T", "P", "E", "Z", "Y"]; // Add more if needed
    const negPrefixes = ["", "m", "μ", "n", "p", "f", "a", "z", "y"];
    const base = 1000;
    const negBase = 1 / 1000;
    let prefixIndex = 0;
    let negPrefixIndex = 0;
    let formattedNum;
    let isNegative = num < 0;

    let absNum = Math.abs(num);

    if (absNum < 1 && absNum !== 0) {
            while (absNum < 1 && negPrefixIndex < negPrefixes.length - 1) {
                absNum /= negBase;
                negPrefixIndex++;
            }
        formattedNum = absNum.toPrecision(precision);
        if (formattedNum.indexOf("e") !== -1) {
            let tempNum = Number(formattedNum);
            formattedNum = tempNum.toPrecision(precision);
        }
          return (isNegative ? "-" : "") + formattedNum + negPrefixes[negPrefixIndex];
     } else if (absNum >= 1){
        while (absNum >= base && prefixIndex < prefixes.length - 1) {
            absNum /= base;
            prefixIndex++;
        }

        formattedNum = absNum.toPrecision(precision);
        if (formattedNum.indexOf("e") !== -1) {
            let tempNum = Number(formattedNum);
            formattedNum = tempNum.toPrecision(precision);
        }

       return (isNegative ? "-" : "")+ formattedNum + prefixes[prefixIndex];
    } else {
        return "0";
    }
}