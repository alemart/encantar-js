# SpeedyPromise

[Speedy](speedy.md) includes its own implementation of promises. A `SpeedyPromise` works just like a standard promise. SpeedyPromises are designed for real-time applications. There are some subtle differences behind the scenes, but you need not be concerned with those.

## Instantiation

### Speedy.Promise

`new Speedy.Promise(executor: function): SpeedyPromise`

Creates a new `SpeedyPromise`. This works just like the constructor of a standard promise.

**Arguments**

* `executor: function`. A function that takes two functions as arguments:
    * `resolve: function`. To be called when the promise is resolved.
    * `reject: function`. To be called when the promise is rejected.

**Returns**

A new `SpeedyPromise`.

**Example**

```js
function sleep(ms)
{
    return new Speedy.Promise((resolve, reject) => {
        if(ms >= 0)
            setTimeout(resolve, ms);
        else
            reject(new Error('Invalid time'));
    });
}

sleep(2000).then(() => {
    console.log('2 seconds have passed');
}).catch(error => {
    console.error(error.message);
}).finally(() => {
    console.log('Done!');
});
```