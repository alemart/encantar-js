/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview The ball
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { Entity } from './entity.js';
import { GameEvent } from '../core/events.js';

/** Radius of the ball */
const BALL_RADIUS = 0.27;

/** Minimum distance for scoring 3 points */
const THREE_POINT_THRESHOLD = 5.5;

/** Shoot angle */
const SHOOT_ANGLE = Math.PI / 4;

/** Shoot sensitivity multiplier (y and z axes) */
const SHOOT_SENSITIVITY = 1.35;

/** Shoot sensitivity multiplier (x-axis) */
const SHOOT_HORIZONTAL_SENSITIVITY = 0.5;

/** Distance from the camera to the ball plane in the ready state */
const PLANE_DISTANCE = 1.0;

/** Y offset applied to the ball in the ready state (from the center of the view) */
const PLANE_BALL_OFFSET = -0.35;

/** Maximum distance from the camera to the ball, so that the ball is considered "lost" in the thrown state */
const MAX_DISTANCE = 15;

/** Maximum distance in the y-axis from ar.root to the ball, so that the ball is considered "lost" in the thrown state */
const MAX_Y_DISTANCE = 5;

/** Frequency of the shining effect, in Hz */
const SHINE_FREQUENCY = 2.0;

/** Maximum brightness of the ball when the shining effect is applied (a value in [0,1]) */
const SHINE_MAX_BRIGHTNESS = 0.25;

/** Duration of fading of the shining effect, in seconds */
const SHINE_FADE_DURATION = 0.25;

/** Collision flag for the backboard */
const FLAG_BACKBOARD = 1;

/** Collision flag for other materials */
const FLAG_OTHER = 2;

/**
 * The ball
 */
export class Ball extends Entity
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);

        this._state = 'ready';
        this._runState = {
            'ready': this._onReadyState,
            'throwing': this._onThrowingState,
            'thrown': this._onThrownState
        };

        this._plane = new BABYLON.Plane(0, 0, 1, 0);
        this._planeOrigin = new BABYLON.Vector3();
        this._positionWhenThrown = new BABYLON.Vector3();
        this._hoopPosition = new BABYLON.Vector3();
        this._mesh = null;
        this._lastTrigger = '';
        this._collisionFlags = 0;
        this._locked = false;
        this._shineFactor = 0;
        this._shineTimer = 0;
    }

    /**
     * Initialize the entity
     * @returns {Promise<void>}
     */
    async init()
    {
        const file = this._game.assetManager.file('ball.glb');
        const gltf = await BABYLON.SceneLoader.ImportMeshAsync('', '', file);
        const mesh = this._createPhysicsRoot(gltf.meshes[0]); // gltf.meshes[0] is __root__

        mesh.actionManager = new BABYLON.ActionManager();

        this._mesh = mesh;

        // the ball is not a child of ar.root
    }

    /**
     * Update the entity
     * @returns {void}
     */
    update()
    {
        const ar = this.ar;

        if(!ar.viewer) {
            this._state = 'ready';
            return;
        }

        this._updatePlane();
        this._shine();

        const fn = this._runState[this._state];
        fn.call(this);
    }

    /**
     * Update callback of the 'ready' state
     * @returns {void}
     */
    _onReadyState()
    {
        const ar = this.ar;
        const mesh = this._mesh;
        const impostor = mesh.physicsImpostor;

        this._lastTrigger = '';
        this._collisionFlags = 0;

        mesh.position.copyFrom(this._planeOrigin);
        mesh.position.y += PLANE_BALL_OFFSET;

        impostor.setLinearVelocity(BABYLON.Vector3.Zero());
        impostor.mass = 0; // disable gravity

        if(this._locked)
            return;

        if(ar.pointers.length > 0) {
            const pointer = ar.pointers[0];
            const position = ar.session.viewport.convertToPixels(pointer.position, pointer.tracker.space);

            if(position.x > 60) {
                impostor.mass = 1; // enable gravity
                this._positionWhenThrown.copyFrom(mesh.absolutePosition);
                this._state = 'throwing';
            }
        }
    }

    /**
     * Update callback of the 'throwing' state
     * @returns {void}
     */
    _onThrowingState()
    {
        const ar = this.ar;

        if(ar.pointers.length == 0) {
            this._state = 'ready';
            return;
        }

        const pointer = ar.pointers[0];

        if(pointer.phase == 'ended')
            this._throw(this._findVelocity(pointer));
        else if(pointer.phase != 'canceled' && this._alignToPointer(pointer))
            this._mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        else
            this._state = 'ready';
    }

    /**
     * Update callback of the 'thrown' state
     * @returns {void}
     */
    _onThrownState()
    {
        const ar = this.ar;
        const rootPosition = ar.root.absolutePosition;
        const cameraPosition = ar.camera.globalPosition;
        const ballPosition = this._mesh.absolutePosition;
        const distance = BABYLON.Vector3.Distance(cameraPosition, ballPosition);

        if(distance > MAX_DISTANCE || ballPosition.y < rootPosition.y - MAX_Y_DISTANCE) {
            this._broadcast(new GameEvent('lostball'));
            this._state = 'ready';
        }
    }

    /**
     * Throw / Shoot the ball
     * @param {Vector2} v velocity
     * @returns {void}
     */
    _throw(v)
    {
        const magnitude = SHOOT_SENSITIVITY * v.y;
        const impulse = new BABYLON.Vector3(
            v.x * SHOOT_HORIZONTAL_SENSITIVITY,
            magnitude * Math.sin(SHOOT_ANGLE),
            -magnitude * Math.cos(SHOOT_ANGLE)
        );

        this._mesh.physicsImpostor.applyImpulse(impulse, this._mesh.absolutePosition);
        this._state = 'thrown';
    }

    /**
     * Find a velocity vector based on a trackable pointer
     * @param {TrackablePointer} pointer
     * @returns {Vector2}
     */
    _findVelocity(pointer)
    {
        if(pointer.movementDuration == 0)
            return pointer.velocity.times(0);

        const averageSpeed = pointer.movementLength / pointer.duration;
        const direction = pointer.initialPosition.directionTo(pointer.position);

        return direction.times(averageSpeed);
    }

    /**
     * This callback is invoked when the ball hits a collider
     * @param {BABYLON.PhysicsImpostor} impostor
     * @returns {void}
     */
    _onCollisionEnter(impostor)
    {
        if(this._state != 'thrown')
            return;

        const mesh = impostor.object;
        const backboard = mesh.getChildMeshes(true, m => m.name == 'Collider_A')[0];
        const collidedWithBackboard = backboard && this._mesh.intersectsMesh(backboard, true);
        const material = collidedWithBackboard ? 'backboard' : 'other';
        const flag = collidedWithBackboard ? FLAG_BACKBOARD : FLAG_OTHER;

        if((this._collisionFlags & flag) == 0) {
            const position = this._mesh.absolutePosition;
            this._broadcast(new GameEvent('ballbounced', { position, material }));
            this._collisionFlags |= flag;
        }
    }

    /**
     * This callback is invoked when the ball hits a trigger
     * @param {BABYLON.Mesh} trigger
     * @returns {void}
     */
    _onTriggerEnter(trigger)
    {
        if(this._state != 'thrown')
            return;

        if(trigger.name == 'Trigger_A') {
            if(this._lastTrigger == '')
                this._lastTrigger = 'A';
        }
        else if(trigger.name == 'Trigger_B') {
            if(this._lastTrigger == 'A')
                this._lastTrigger = 'B';
        }
        else if(trigger.name == 'Trigger_C') {
            if(this._lastTrigger == 'B') {
                this._lastTrigger = 'C';
                this._score();
            }
        }
    }

    /**
     * Score points
     * @returns {void}
     */
    _score()
    {
        const distance = this._calculateDistanceToHoop(this._positionWhenThrown);
        const score = this._calculateScore(distance);
        const position = this._mesh.absolutePosition;

        this._broadcast(new GameEvent('scored', { score, position }));
    }

    /**
     * Calculate the score based on the distance traveled by the ball
     * @param {number} distance
     * @returns {number}
     */
    _calculateScore(distance)
    {
        return distance >= THREE_POINT_THRESHOLD ? 3 : 2;
    }

    /**
     * Calculate the distance between a point and the hoop
     * @param {BABYLON.Vector3} absolutePosition
     * @returns {number}
     */
    _calculateDistanceToHoop(absolutePosition)
    {
        const ar = this.ar;
        const pointA = absolutePosition;
        const pointB = ar.root.absolutePosition.add(this._hoopPosition);

        const groundLike = BABYLON.Plane.FromPositionAndNormal(ar.root.absolutePosition, ar.root.up);
        const projectedPointA = this._orthogonalProjection(groundLike, pointA);
        const projectedPointB = this._orthogonalProjection(groundLike, pointB);

        return BABYLON.Vector3.Distance(projectedPointA, projectedPointB);
    }

    /**
     * Put this._plane in front of the camera
     * @returns {void}
     */
    _updatePlane()
    {
        const ar = this.ar;
        const forwardRay = ar.utils.convertRay(ar.viewer.forwardRay());
        const origin = this._planeOrigin.copyFrom(forwardRay.origin);
        const normal = forwardRay.direction;

        normal.scaleAndAddToRef(PLANE_DISTANCE, origin);
        BABYLON.Plane.FromPositionAndNormalToRef(origin, normal, this._plane);
    }

    /**
     * Align the ball to a pointer
     * @param {TrackablePointer} pointer
     * @returns {boolean} true on success
     */
    _alignToPointer(pointer)
    {
        const ar = this.ar;
        const ray = ar.utils.convertRay(ar.viewer.raycast(pointer.position));
        this._mesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
        return this._intersectRayAndPlane(this._mesh.position, ray);
    }

    /**
     * Intersect a ray with this._plane
     * @param {BABYLON.Vector3} outputPoint
     * @param {BABYLON.Ray} ray
     * @returns {boolean} true if there is a single intersection
     */
    _intersectRayAndPlane(outputPoint, ray)
    {
        const normal = this._plane.normal;
        const direction = ray.direction;

        const dot = direction.dot(normal);
        if(Math.abs(dot) < 1e-5)
            return false;

        const d = this._planeOrigin.subtract(ray.origin).dot(normal) / dot;
        outputPoint.copyFrom(ray.origin);
        ray.direction.scaleAndAddToRef(d, outputPoint);

        return true;
    }

    /**
     * Compute the orthogonal projection of a point onto a plane
     * @param {BABYLON.Plane} plane
     * @param {BABYLON.Vector3} point
     * @returns {BABYLON.Vector3}
     */
    _orthogonalProjection(plane, point)
    {
        const n = plane.normal;
        const p = new BABYLON.Vector3(0, -plane.d/n.y, 0);
        const q = point;

        const u = q.subtract(p);
        const v = n.scale(u.dot(n));
        return q.subtract(v);
    }

    /**
     * Make the ball shine as a visual cue to indicate long distances
     * @returns {void}
     */
    _shine()
    {
        const b = this._shineBrightness();

        this._mesh.getChildMeshes().forEach(child => {
            if(child.material)
                child.material.emissiveColor.set(b, b, b);
        });
    }

    /**
     * Compute the brightness of the shining ball
     * @returns {number} in [0,1]
     */
    _shineBrightness()
    {
        if(this._state == 'thrown' || !this._mesh.isEnabled) {
            this._shineFactor = this._shineTimer = 0;
            return 0;
        }

        const ar = this.ar;
        const dt = ar.session.time.delta;
        const rate = 1.0 / SHINE_FADE_DURATION;
        const distance = this._calculateDistanceToHoop(this._mesh.absolutePosition);

        // shine if long distance
        if(distance >= THREE_POINT_THRESHOLD) {
            this._shineFactor = 1;
            this._shineTimer += dt;
        }
        else {
            this._shineFactor -= rate * dt;
            if(this._shineFactor <= 0)
                this._shineFactor = this._shineTimer = 0;
        }

        const t = this._shineTimer;
        const s = 0.5 - 0.5 * Math.cos(2 * Math.PI * SHINE_FREQUENCY * t);
        return this._shineFactor * SHINE_MAX_BRIGHTNESS * s;
    }

    /**
     * Create a root node with a physics impostor
     * @param {BABYLON.Mesh} mesh from gltf
     * @param {number} radius radius of the ball
     * @returns {BABYLON.Mesh}
     */
    _createPhysicsRoot(mesh)
    {
        const r = BALL_RADIUS;
        const rd = r * 0.99;

        // prepare the mesh
        mesh.scaling.set(rd, rd, rd); // original radius = 1
        mesh.getChildMeshes().forEach(child => {
            if(child.material)
                child.material.specularIntensity = 0;
        });

        // create the root node
        const physicsRoot = BABYLON.MeshBuilder.CreateSphere('Ball', { diameter: 2 * r });
        physicsRoot.isVisible = false;
        physicsRoot.addChild(mesh);

        physicsRoot.physicsImpostor = new BABYLON.PhysicsImpostor(physicsRoot, BABYLON.PhysicsImpostor.SphereImpostor, {
            mass: 0.5,
            restitution: 0.5
        });

        return physicsRoot;
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        switch(event.type) {
            case 'targetfound':
                this._mesh.setEnabled(true);
                break;

            case 'targetlost':
                this._mesh.setEnabled(false);
                break;

            case 'triggerready':
                this._mesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction({
                        trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                        parameter: {
                            mesh: event.detail.mesh,
                            usePreciseIntersection: true
                        }
                    }, () => this._onTriggerEnter(event.detail.mesh))
                );
                break;

            case 'colliderready':
                this._mesh.physicsImpostor.registerOnPhysicsCollide(
                    event.detail.impostor,
                    (_, collided) => this._onCollisionEnter(collided)
                );
                break;

            case 'hoopready':
                this._hoopPosition.copyFrom(event.detail.position);
                break;

            case 'netready':
                event.detail.entity.setBall(this._mesh);
                break;

            case 'gameover':
                this._locked = true;
                break;

            case 'gameoverdismissed':
                this._locked = false;
                break;
        }
    }
}