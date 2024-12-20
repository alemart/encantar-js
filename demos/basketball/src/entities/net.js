/**
 * -------------------------------------------
 * Magic AR Basketball
 * A demo game of the encantar.js WebAR engine
 * -------------------------------------------
 * @fileoverview Basketball Net with cloth physics
 * @author Alexandre Martins <alemartf(at)gmail.com> (https://github.com/alemart/encantar-js)
 */

import { PhysicsEntity } from './entity.js';
import { GameEvent } from '../core/events.js';

/** Number of rings / segments parallel to the XZ plane (in model space) */
const NUMBER_OF_RINGS = 4;

/** Height of the mesh */
const HEIGHT = 0.67;

/** XZ scale of the bottom ring */
const XZ_FALLOFF_SCALE = 0.6;

/** XZ scale of the particles */
const XZ_PARTICLE_SCALE = 0.8; //1;

/**
 * Basketball Net with cloth physics
 */
export class BasketballNet extends PhysicsEntity
{
    /**
     * Constructor
     * @param {BasketballGame} game
     */
    constructor(game)
    {
        super(game);

        this._physicsRoot = null;
        this._mesh = null;
        this._mirrorMesh = null;

        this._vertices = [];
        this._indices = [];
        this._particles = [];

        this._ball = null;
        this._freezeTime = 0;
        this._xzParticleScaleVector = new BABYLON.Vector3(XZ_PARTICLE_SCALE, 1, XZ_PARTICLE_SCALE);
    }

    /**
     * Initialize the entity
     * @returns {void}
     */
    init()
    {
        this._physicsRoot = new BABYLON.Mesh('BasketballNet');

        this._mesh = new BABYLON.Mesh('BasketballNetMesh');
        this._mesh.material = this._createMaterial();
        this._mesh.parent = this._physicsRoot;
        this._mesh.alphaIndex = 1;

        this._mirrorMesh = new BABYLON.Mesh('BasketballNetMirrorMesh');
        this._mirrorMesh.material = this._mesh.material;
        this._mirrorMesh.parent = this._physicsRoot;
        this._mirrorMesh.alphaIndex = 0;
    }

    /**
     * Update the entity
     * @returns {void}
     */
    update()
    {
        const maxSpeed = 2.5, minSpeed = 0.1, maxTime = 1.5;
        const deceleration = maxSpeed / maxTime;
        const elapsedTime = this.ar.session.time.elapsed;

        // we only move the particles if the ball is or was just nearby
        if(this._mesh.intersectsMesh(this._ball))
            this._freezeTime = elapsedTime + maxTime;

        if(elapsedTime < this._freezeTime) {
            this._sleepParticles(false);
            let avgSpeed = this._decelerateParticles(deceleration, maxSpeed);

            // stop early
            if(avgSpeed < minSpeed)
                this._freezeTime = elapsedTime;
        }
        else {
            this._resetParticles();
            this._sleepParticles(true);
        }

        this._updateMesh();
    }

    /**
     * Move the net by an offset
     * @param {BABYLON.Vector3} offset
     * @returns {void}
     */
    moveBy(offset)
    {
        this._physicsRoot.position.addInPlace(offset);
    }

    /**
     * Set a reference to the mesh of the ball
     * @param {BABYLON.Mesh} ball
     * @returns {void}
     */
    setBall(ball)
    {
        this._ball = ball;
    }

    /**
     * Handle an event
     * @param {GameEvent} event
     * @returns {void}
     */
    handleEvent(event)
    {
        if(event.type == 'hooksready') {
            const hooks = event.detail.hooks;
            this._createNet(hooks);
        }
        else if(event.type == 'targetfound') {
            if(this._particles.length > 0) {
                this._resetParticles();
                this._updateMesh();
                this._freezeTime = 0;
            }
        }
    }

    /**
     * Create the material of the basketball net
     * @returns {BABYLON.StandardMaterial}
     */
    _createMaterial()
    {
        const material = new BABYLON.StandardMaterial('BasketballNetMaterial');
        const url = this._game.assetManager.url('atlas.png');

        material.diffuseTexture = new BABYLON.Texture(url);
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.backFaceCulling = true;
        material.unlit = true;
        //material.wireframe = true;

        return material;
    }

    /**
     * Create the basketball net
     * @param {BABYLON.Mesh[]} hooks
     * @returns {void}
     */
    _createNet(hooks)
    {
        this._createMesh(hooks);
        this._createParticles();
        this._broadcast(new GameEvent('netready', { entity: this }));
    }

    /**
     * Create a custom mesh of a basketball net
     * @param {BABYLON.Mesh[]} hooks
     * @returns {void}
     */
    _createMesh(hooks)
    {
        const n = hooks.length;
        const r = NUMBER_OF_RINGS - 1;
        const h = HEIGHT / r;
        const tmp = new BABYLON.Vector3();
        const vertexData = new BABYLON.VertexData();
        const positions = [], indices = [], uvs = [], normals = [];
        const alpha = 1 - XZ_FALLOFF_SCALE;
        const falloff = x => 1 - alpha * x; // x in [0,1]

        // validate
        if(n == 0 || NUMBER_OF_RINGS < 2)
            throw new Error();

        // setup the vertices
        const vertexCount = n * NUMBER_OF_RINGS;
        this._vertices = Array.from({ length: vertexCount }, () => new BABYLON.Vector3());
        this._indices.length = 0;

        // the origin of the mesh will be positioned at the geometrical center of the hooks
        const center = this._findCenterOfHooks(hooks);
        this._physicsRoot.position.copyFrom(center);

        // setup the top ring
        // the local space of the mesh is centered at the origin of the XZ plane
        for(let i = 0; i < n; i++) {
            const vertex = this._vertices[i];
            vertex.copyFrom(hooks[i].position).subtractInPlace(center);
        }

        // setup the other rings
        for(let k = 1; k <= r; k++) {
            for(let i = 0; i < n; i++) {
                const f = falloff(k/r);
                const s = tmp.set(f, 1, f);

                // find the position of the next vertex
                const prevVertex = this._vertices[i+(k-1)*n];
                const nextVertex = this._vertices[i+k*n];
                nextVertex.copyFrom(prevVertex)
                .addInPlaceFromFloats(0, -h, 0)
                .multiplyInPlace(s);

                // for each vertex of the mesh, we create two triangles with
                // nearby vertices. Here we store the indices of the vertices
                const j = (i + n-1) % n;
                this._indices.push(
                    i+(k-1)*n, j+(k-1)*n, j+k*n,
                    j+k*n, i+k*n, i+(k-1)*n
                );
            }
        }

        // setup the mesh
        for(let j = 0; j < this._indices.length; j++) {
            const index = this._indices[j];
            const vertex = this._vertices[index];
            const i = index % n, k = (index / n) | 0;

            const u = 2*i < n ? 2*i/n : 2*(1-i/n);
            const v = 0.5*(1-k/r);

            positions.push(vertex.x, vertex.y, vertex.z);
            uvs.push(u, v);
            indices.push(j);
        }

        // setup vertex data
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.uvs = uvs;
        vertexData.applyToMesh(this._mesh, true);

        /*

        We would like to see the inside and the outside of the basketball
        net simultaneously. Although disabling backface culling seems like
        a reasonable line of thought, the mesh is alpha blended. Disabling
        backface culling in this case makes the front and the back faces
        appear garbled (refer to the Transparent Rendering section of the
        babylon.js documentation). We get around this issue by enabling
        backface culling and by creating a mirror of the mesh. The mirror
        has the same triangles as the original mesh, but we reverse their
        orientation. The back faces of the mesh are the front faces of the
        mirror. We can then see the inside and the outside of the net!

        */
        vertexData.indices = indices.reverse();
        vertexData.applyToMesh(this._mirrorMesh, true);
    }

    /**
     * Create the physics particles
     * @returns {void}
     */
    _createParticles()
    {
        const physicsRoot = this._physicsRoot;
        const n = this._vertices.length / NUMBER_OF_RINGS;
        const r = NUMBER_OF_RINGS - 1;
        const zero = BABYLON.Vector3.Zero();
        const xz = this._xzParticleScaleVector;

        // setup the particles and the impostors
        this._particles = Array.from({ length: this._vertices.length }, (_, i) => {
            const particle = BABYLON.MeshBuilder.CreateSphere('BasketballNetParticle_' + i, {
                diameter: 1/32
            });

            const vertex = this._vertices[i];
            particle.isVisible = false;
            particle.position.copyFrom(vertex).multiplyInPlace(xz);

            const TOTAL_MASS = 0.16;
            particle.physicsImpostor = new BABYLON.PhysicsImpostor(particle, BABYLON.PhysicsImpostor.ParticleImpostor, {
                mass: (i == 0) ? 0 : TOTAL_MASS / this._vertices.length, // actually, mass / (|v|-1)
            });
            particle.physicsImpostor.setLinearVelocity(zero);

            return particle;
        });

        // lock particles of the top ring
        for(let i = 1; i < n; i++) {
            const p = this._particles[0];
            const q = this._particles[i];

            const jointPQ = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.LockJoint, {});

            p.physicsImpostor.addJoint(q.physicsImpostor, jointPQ);
        }

        // create cloth pattern
        for(let k = 1; k <= r; k++) {
            for(let i = 0; i < n; i++) {
                const j = (i + n-1) % n;
                const p = this._particles[i+k*n];
                const q = this._particles[j+k*n];
                const r = this._particles[i+(k-1)*n];

                const distPQ = BABYLON.Vector3.Distance(p.position, q.position);
                const distPR = BABYLON.Vector3.Distance(p.position, r.position);

                const jointPQ = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.DistanceJoint, { maxDistance: distPQ });
                const jointPR = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.DistanceJoint, { maxDistance: distPR });

                p.physicsImpostor.addJoint(q.physicsImpostor, jointPQ);
                p.physicsImpostor.addJoint(r.physicsImpostor, jointPR);
            }
        }

        // set parent objects (at the end)
        for(let i = 0; i < this._particles.length; i++)
            this._particles[i].parent = physicsRoot;

        physicsRoot.parent = this.physicsAnchor;
    }

    /**
     * Put particles to sleep or wake them up
     * @param {boolean} sleep
     * @returns {void}
     */
    _sleepParticles(sleep)
    {
         for(let i = 0; i < this._particles.length; i++) {
            const particle = this._particles[i];       
            const impostor = particle.physicsImpostor;

            if(sleep)
                impostor.sleep();
            else
                impostor.wakeUp();
         }
    }

    /**
     * Reset the particles to their initial position and velocity
     * @returns {void}
     */
    _resetParticles()
    {
        const zero = this._particles[0].physicsImpostor.getLinearVelocity();
        const xz = this._xzParticleScaleVector;

        for(let i = 0; i < this._particles.length; i++) {
            const particle = this._particles[i];
            const vertex = this._vertices[i];

            particle.position.copyFrom(vertex).multiplyInPlace(xz);
            particle.physicsImpostor.setLinearVelocity(zero);
        }
    }

    /**
     * Reduce the linear velocity of the particles
     * @param {number} rate in velocity units per second
     * @param {number} maxSpeed
     * @returns {number} the average speed of the particles
     */
    _decelerateParticles(rate, maxSpeed)
    {
        const dt = this.ar.scene.getPhysicsEngine().getTimeStep();
        const xz = this._xzParticleScaleVector;
        let sumOfSpeeds = 0;

        for(let i = 1; i < this._particles.length; i++) {
            const vertex = this._vertices[i];
            const particle = this._particles[i];
            const impostor = particle.physicsImpostor;
            const velocity = impostor.getLinearVelocity();
            let speed = velocity.length();

            if(vertex.y == 0) { // if hook
                particle.position.copyFrom(vertex).multiplyInPlace(xz);
                speed = 0;
            }

            speed -= rate * dt;
            speed = Math.max(0, Math.min(speed, maxSpeed));
            sumOfSpeeds += speed;

            velocity.normalize().scaleInPlace(speed);
            impostor.setLinearVelocity(velocity);
        }

        return sumOfSpeeds / this._particles.length;
    }

    /**
     * Update the mesh by linking its vertices to the particles
     * @returns {void}
     */
    _updateMesh()
    {
        const positions = this._mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const xz = 1 / XZ_PARTICLE_SCALE;

        for(let i = 0, j = 0; i < this._indices.length; i++, j += 3) {
            const particleIndex = this._indices[i];
            const particle = this._particles[particleIndex];

            positions[j+0] = particle.position.x * xz;
            positions[j+1] = particle.position.y;
            positions[j+2] = particle.position.z * xz;
        }

        this._mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        this._mirrorMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

        // recompute the normals? the material is unlit
    }

    /**
     * Find the geometrical center of a set of hooks
     * @param {BABYLON.Mesh[]} hooks non-empty array
     * @returns {BABYLON.Vector3}
     */
    _findCenterOfHooks(hooks)
    {
        const center = new BABYLON.Vector3(0, 0, 0);

        for(const hook of hooks) {
            center.x += hook.position.x;
            center.y += hook.position.y;
            center.z += hook.position.z;
        }

        return center.scaleInPlace(1 / hooks.length);
    }
}

