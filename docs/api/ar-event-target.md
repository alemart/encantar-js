# AREventTarget

An AREventTarget is an object that is able to receive [AREvents](ar-event.md). You may add [event listeners](ar-event-listener.md) to it in order to listen to "relevant changes" in its state.

## Methods

### addEventListener

`target.addEventListener(type: AREventType, listener: AREventListener): void`

Add an event listener to `target`.

**Arguments**

* `type: AREventType`. The type of event you intend to listen to.
* `listener: AREventListener`. The event listener you intend to add.

**Example**

```js
session.addEventListener('end', event => {
    console.log('The session has ended.');
});
```

### removeEventListener

`target.removeEventListener(type: AREventType, listener: AREventListener): void`

Remove an event listener from `target`.

**Arguments**

* `type: AREventType`. The type of event you are listening to.
* `listener: AREventListener`. The event listener you intend to remove.