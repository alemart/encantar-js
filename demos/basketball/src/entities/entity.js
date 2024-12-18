/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Definition of game entities
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

/**
 * Game Entity
 */
export class Entity
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        this._game = game;
    }

    /**
     * Initialize the entity
     * @returns {Promise<void>|void}
     */
    init()
    {
        return Promise.resolve();
    }

    /**
     * Update the entity
     * @returns {void}
     */
    update()
    {
    }

    /**
     * Release resources
     * @returns {void}
     */
    release()
    {
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
    }

    /**
     * Broadcast an event
     * @param {GameEvent} event
     * @returns {void}
     */
    _broadcast(event)
    {
        this._game.broadcast(event);
    }

    /**
     * A reference to the ARSystem
     * @returns {ARSystem | null}
     */
    get ar()
    {
        return this._game.ar;
    }
}

/**
 * An entity with a physics root node displayed in AR
 * @abstract
 */
export class PhysicsEntity extends Entity
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);
        this._physicsAnchor = null;
    }

    /**
     * The parent of the physics root node
     * Parenting the physics root should be done after creating all the impostors
     * @returns {BABYLON.TransformNode}
     */
    get physicsAnchor()
    {
        //return this.ar.root; // doesn't work as expected with multiple physics compounds (babylon.js 7.38)

        if(!this._physicsAnchor) {
            const ar = this.ar;
            const id = PhysicsEntity._nextId++;

            // physicsAnchor is an intermediate node
            this._physicsAnchor = new BABYLON.TransformNode('physicsAnchor_' + id);
            this._physicsAnchor.parent = ar.root;
        }

        return this._physicsAnchor;
    }
}

PhysicsEntity._nextId = 1;
