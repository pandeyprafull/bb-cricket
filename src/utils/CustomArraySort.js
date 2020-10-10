const sortArr = (arr) => {
    let swap, done = false, swapped;
    while (done === false) {
        swapped = 0;
        for (i = 1; i < arr.length; i++) {
            if (arr[i - 1] > arr[i]) {
                swap = arr[i];
                arr[i] = arr[i - 1];
                arr[i - 1] = swap;
                swapped = 1;
            }
        }
        if (swapped === 0) {
            done = true;
        }
    }
    return arr;
}
module.exports = sortArr