import * as THREE from 'three'
import metal from '../../assets/metal.jpg'

const bodyWidth = 4
const bodyLength = 6
const bodyHeight = 2
const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyLength, bodyHeight)

const gunBoxWidth = bodyWidth / 2
const gunBoxLength = bodyLength / 2
const gunBoxHeight = bodyHeight / 2
const gunBoxGeometry = new THREE.BoxGeometry(gunBoxWidth, gunBoxLength, gunBoxHeight)

const barrelRadius = 0.25
const barrelLength = 3
const barrelGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 6)

const tankTexture = new THREE.TextureLoader().load(metal)
const material = new THREE.MeshLambertMaterial({ map: tankTexture })

function Tank() {
	this.root = new THREE.Object3D()

	const body = new THREE.Mesh(bodyGeometry, material)
	body.position.set(0, 0, bodyHeight)
	body.receiveShadow = true
	this.root.add( body )

	const gunBox = new THREE.Mesh(gunBoxGeometry, material)
	gunBox.position.set(0, 0, (bodyHeight + gunBoxHeight) / 2)
	gunBox.receiveShadow = true
	body.add(gunBox)

	const gun = new THREE.Object3D()
	gun.position.set(0, gunBoxLength / 4, 0)
	const barrel = new THREE.Mesh(barrelGeometry, material)
	barrel.translateY(barrelLength / 2)
	gun.add(barrel)
	gunBox.add(gun)

	this.update = (state) => {
		gunBox.rotation.z = THREE.Math.degToRad( state.gl )
		gun.rotation.x = THREE.Math.degToRad( state.gu )
	}
}

export default Tank
