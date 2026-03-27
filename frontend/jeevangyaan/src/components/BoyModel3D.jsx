import React, { useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class CanvasErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.warn('[BoyModel3D] Canvas error caught by boundary:', error.message);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(160deg, #0f0c29 0%, #1a1a4e 50%, #24243e 100%)',
                    color: '#a5b4fc', fontSize: '1rem', gap: '12px'
                }}>
                    <span style={{ fontSize: '3rem' }}>🤖</span>
                    <span>3D avatar unavailable</span>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Inner scene component ───────────────────────────────────────────────────
function BoyCharacter({ isSpeaking, mouthSignal }) {
    const group = useRef();
    const { scene, animations } = useGLTF('/buisness_man_converted.glb');
    const { actions } = useAnimations(animations, group);
    const jawBone = useRef(null);

    useEffect(() => {
        // Fix transparency and possible color issues for CC3 models
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    // Hide tearline/occlusion which often break transparency in GLTF
                    if (child.name.includes('TearLine') || child.name.includes('EyeOcclusion') || 
                        child.material.name.includes('TearLine') || child.material.name.includes('EyeOcclusion')) {
                        child.visible = false;
                    }
                    // Fix in case the emissive color is blowing out the texture
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                    // If it's completely white, sometimes the base color was overridden
                    // but the texture exists in map. We ensure the color is white so the map shows.
                    if (child.material.map) {
                        child.material.color.setHex(0xffffff);
                    }
                }
            }
            // Find jaw bone just in case we need procedural mouth
            if (child.isBone && child.name === 'JawRoot_040') {
                jawBone.current = child;
            }
        });

        // Compute bounding box to center the model properly
        const box = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        const ctr = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(ctr);
        
        // Center the model horizontally, and place feet at y=0
        scene.position.x = -ctr.x;
        scene.position.z = -ctr.z;
        scene.position.y = -box.min.y;
    }, [scene]);

    useEffect(() => {
        if (!actions) return;
        const talkAction = actions['CC3_Base_Plus_TempMotion'];
        if (talkAction) {
            talkAction.play();
            if (isSpeaking) {
                talkAction.paused = false;
                talkAction.setEffectiveTimeScale(1);
            } else {
                // To avoid T-pose, we don't fade out, just pause the action at a natural frame.
                talkAction.paused = true;
                // Move to a non-t-pose frame (e.g. 0 implies starting pose, which is usually natural)
                // We let it lock into the current pose or reset to 0. 
                // Using 0 is reliable if the first frame is an idle pose.
                talkAction.time = 0;
            }
        }
    }, [isSpeaking, actions]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Gentle breathing bob
        if (group.current) {
            group.current.position.y = Math.sin(t * 1.5) * 0.005;
        }

        // Procedural jaw movement fallback if built-in animation doesn't move jaw
        if (jawBone.current && isSpeaking && mouthSignal !== undefined) {
             jawBone.current.rotation.x = THREE.MathUtils.lerp(jawBone.current.rotation.x, mouthSignal * 0.4, 0.2);
        }
    });

    return (
        <group ref={group}>
            <primitive object={scene} />
        </group>
    );
}

function Loader() {
    return <div />;
}

function SpeakingRing({ isSpeaking }) {
    const mesh = useRef();
    useFrame((state) => {
        if (!mesh.current) return;
        const t = state.clock.getElapsedTime();
        mesh.current.scale.setScalar(isSpeaking ? 1 + Math.sin(t * 4) * 0.06 : 1);
        mesh.current.material.opacity = isSpeaking ? 0.3 + Math.sin(t * 4) * 0.1 : THREE.MathUtils.lerp(mesh.current.material.opacity, 0, 0.06);
    });
    return (
        <mesh ref={mesh} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.8, 64]} />
            <meshBasicMaterial color="#818cf8" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
    );
}

const BoyModel3D = ({ isSpeaking, mouthSignal }) => {
    return (
        <div className="avatar-3d-container">
            {isSpeaking && (
                <div className="speaking-label">
                    <span className="dot" /> Speaking…
                </div>
            )}
            <CanvasErrorBoundary>
                {/* 
                  Camera zoomed in more for better visibility of the avatar 
                  Position moved closer [2.8 -> 2.2] and slightly higher [1.4 -> 1.45]
                  FOV narrowed [42 -> 38]
                */}
                <Canvas camera={{ position: [0, 1.45, 2.2], fov: 38 }} shadows>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 2, 3]} intensity={1.2} castShadow />
                    <Environment preset="city" />
                    <Suspense fallback={<Loader />}>
                        <BoyCharacter isSpeaking={isSpeaking} mouthSignal={mouthSignal} />
                        <SpeakingRing isSpeaking={isSpeaking} />
                        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={5} blur={2.5} far={4} />
                    </Suspense>
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={true} 
                        target={[0, 1.3, 0]} 
                        minAzimuthAngle={-Math.PI / 4} 
                        maxAzimuthAngle={Math.PI / 4} 
                        minPolarAngle={Math.PI / 3} 
                        maxPolarAngle={Math.PI / 2} 
                    />
                </Canvas>
            </CanvasErrorBoundary>
        </div>
    );
};

useGLTF.preload('/buisness_man_converted.glb');
export default BoyModel3D;
