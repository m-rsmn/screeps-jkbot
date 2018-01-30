import {Constants} from "os/core/Constants";
import {SpawnManagerProcess} from "os/processes/room/SpawnManagerProcess";
import {Process} from "../../core/Process";

export class EnergyManagementProcess extends Process {
    public type = "energyManager";

    public metaData: MetaData["energyManager"];

    public run() {
        let spawnManagerProcessName = "spawnManager-" + this.metaData.roomName;

        if (!this.kernel.hasProcess(spawnManagerProcessName)) {
            this.suspend = 1;
        }

        let spawnManager: SpawnManagerProcess = this.kernel.getProcessByName(spawnManagerProcessName)!;
        let room = Game.rooms[this.metaData.roomName];

        let process = this;
        _.forEach(room.memory.sources, function(source) {

            if (source.isMinedBy.miners < 1) {
                spawnManager.addCreepToSpawnQue({
                    meta: {target: {x: source.x, y: source.y, id: source.id}},
                    parentProcess: process.name,
                    priority: Constants.PRIORITY_MEDIUM,
                    processToCreate: "minerLifeCycle",
                    type: "miner"
                });

                room.memory.sources[source.id].isMinedBy.miners++;

            }

            if (source.isMinedBy.haulers < 2) {
                spawnManager.addCreepToSpawnQue({
                    meta: {target: {x: source.x, y: source.y, id: source.id}},
                    parentProcess: process.name,
                    priority: Constants.PRIORITY_MEDIUM,
                    processToCreate: "haulerLifeCycle",
                    type: "hauler"
                });

                room.memory.sources[source.id].isMinedBy.haulers++;
            }

        });
    }

    public getPickUpPoint(): BasicObjectInfo | boolean {

        let room = Game.rooms[this.metaData.roomName];

        if (!room || !room.controller) {
            return false;
        }

        if (room.energyAvailable <= 250) {
            return false;
        }

        if (room.controller.level === 1) {
            return room.memory.spawns[0];
        }

        // TODO modify for other RCLs
        return room.memory.spawns[0];
    }

    public getDropOffPoint(): BasicObjectInfo | boolean {
        // TODO if room has storage => direct to storage
        // TODO rcl 2 => place container near spawn and use it as poor man's storage if needed

        let room = Game.rooms[this.metaData.roomName];

        if (!room || !room.controller) {
            return false;
        }

        let dropOff: BasicObjectInfo;

        if (room.controller.level <= 3) {

            dropOff = _.find(room.memory.spawns, function(spawnInfo) {
                let spawn = Game.spawns[spawnInfo.spawnName];
                return (spawn && spawn.energy < spawn.energyCapacity);
            })!;

            if (dropOff) {
                return dropOff;
            }
        }

        return false;
    }
}
