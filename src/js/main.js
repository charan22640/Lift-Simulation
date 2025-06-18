class LiftSimulation {
    constructor() {
        this.lifts = [];
        this.floors = 0;
        this.liftCount = 0;
        this.floorRequests = new Set();
        this.isSimulationActive = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateSimulation();
        });

        document.getElementById('disable-lift-btn').addEventListener('click', () => {
            this.disableLift();
        });

        document.getElementById('enable-all-lifts-btn').addEventListener('click', () => {
            this.enableAllLifts();
        });
    }

    generateSimulation() {
        const floorsInput = document.getElementById('floors');
        const liftsInput = document.getElementById('lifts');
        
        this.floors = parseInt(floorsInput.value);
        this.liftCount = parseInt(liftsInput.value);
        
        if (this.floors < 2 || this.floors > 10) {
            this.showStatus('Please enter 2-10 floors', 'error');
            return;
        }
        
        if (this.liftCount < 1 || this.liftCount > 5) {
            this.showStatus('Please enter 1-5 lifts', 'error');
            return;
        }

        this.initializeLifts();
        this.createBuilding();
        this.updateLiftStatusDisplay();
        this.isSimulationActive = true;
        this.showStatus('Simulation generated successfully!', 'success');
    }

    initializeLifts() {
        this.lifts = [];
        for (let i = 1; i <= this.liftCount; i++) {
            this.lifts.push({
                id: i,
                currentFloor: 0,
                targetFloors: [],
                doorOpen: false,
                disabled: false,
                isMoving: false,
                direction: null // 'up', 'down', or null
            });
        }
    }

    createBuilding() {
        const buildingContainer = document.getElementById('building');
        buildingContainer.innerHTML = '';        for (let floor = this.floors - 1; floor >= 0; floor--) {
            const floorDiv = document.createElement('div');
            floorDiv.className = 'floor';
            floorDiv.setAttribute('data-floor', floor);

            // Floor info section
            const floorInfo = document.createElement('div');
            floorInfo.className = 'floor-info';
            
            const floorNumber = document.createElement('div');
            floorNumber.className = 'floor-number';
            floorNumber.textContent = floor === 0 ? 'G' : floor;
            
            const callButton = document.createElement('button');
            callButton.className = 'call-button';
            callButton.textContent = 'Call';
            callButton.addEventListener('click', () => this.callLift(floor));
            
            floorInfo.appendChild(floorNumber);
            floorInfo.appendChild(callButton);

            // Lift shafts section
            const liftShafts = document.createElement('div');
            liftShafts.className = 'lift-shafts';            for (let liftId = 1; liftId <= this.lifts.length; liftId++) {
                const shaft = document.createElement('div');
                shaft.className = 'lift-shaft';
                shaft.setAttribute('data-lift-id', liftId);

                // Create lift element on ground floor for each lift
                if (floor === 0) {
                    const liftData = this.lifts.find(l => l.id === liftId);
                    if (liftData && liftData.currentFloor === floor) {
                        const lift = this.createLiftElement(liftId);
                        shaft.appendChild(lift);
                    }
                }

                liftShafts.appendChild(shaft);
            }

            floorDiv.appendChild(floorInfo);
            floorDiv.appendChild(liftShafts);
            buildingContainer.appendChild(floorDiv);
        }
    }

    createLiftElement(liftId) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.setAttribute('data-lift-id', liftId);

        const liftIdLabel = document.createElement('div');
        liftIdLabel.className = 'lift-id';
        liftIdLabel.textContent = `Lift ${liftId}`;

        const doors = document.createElement('div');
        doors.className = 'lift-doors';

        const leftDoor = document.createElement('div');
        leftDoor.className = 'lift-door left';

        const rightDoor = document.createElement('div');
        rightDoor.className = 'lift-door right';

        doors.appendChild(leftDoor);
        doors.appendChild(rightDoor);
        lift.appendChild(liftIdLabel);
        lift.appendChild(doors);

        return lift;
    }

    async callLift(targetFloor) {
        if (!this.isSimulationActive) {
            this.showStatus('Please generate simulation first', 'error');
            return;
        }

        // Add visual feedback to button
        const callButton = document.querySelector(`[data-floor="${targetFloor}"] .call-button`);
        callButton.classList.add('active');
        
        // Find the best available lift
        const bestLift = this.findBestLift(targetFloor);
        
        if (!bestLift) {
            this.showStatus('No lifts available at the moment', 'error');
            setTimeout(() => {
                callButton.classList.remove('active');
            }, 2000);
            return;
        }

        // Add target floor to lift's queue
        if (!bestLift.targetFloors.includes(targetFloor)) {
            bestLift.targetFloors.push(targetFloor);
            bestLift.targetFloors.sort((a, b) => {
                if (bestLift.direction === 'up') {
                    return a - b;
                } else if (bestLift.direction === 'down') {
                    return b - a;
                } else {
                    return Math.abs(a - bestLift.currentFloor) - Math.abs(b - bestLift.currentFloor);
                }
            });
        }

        // Start moving the lift if it's not already moving
        if (!bestLift.isMoving) {
            this.moveLift(bestLift);
        }

        this.updateLiftStatusDisplay();
    }

    findBestLift(targetFloor) {
        const availableLifts = this.lifts.filter(lift => !lift.disabled);
        
        if (availableLifts.length === 0) return null;

        // Find the closest available lift
        let bestLift = availableLifts[0];
        let minDistance = Math.abs(bestLift.currentFloor - targetFloor);

        for (const lift of availableLifts) {
            const distance = Math.abs(lift.currentFloor - targetFloor);
            
            // Prefer lifts that are not moving or are moving in the same direction
            if (distance < minDistance || 
                (distance === minDistance && !lift.isMoving)) {
                bestLift = lift;
                minDistance = distance;
            }
        }

        return bestLift;
    }

    async moveLift(lift) {
        if (lift.disabled || lift.targetFloors.length === 0) return;

        lift.isMoving = true;
        
        while (lift.targetFloors.length > 0 && !lift.disabled) {
            const targetFloor = lift.targetFloors.shift();
            
            // Determine direction
            if (targetFloor > lift.currentFloor) {
                lift.direction = 'up';
            } else if (targetFloor < lift.currentFloor) {
                lift.direction = 'down';
            }

            // Move to target floor
            await this.animateLiftMovement(lift, targetFloor);
            
            if (lift.disabled) break;

            // Open doors
            await this.operateDoors(lift, true);
            
            // Keep doors open for 2.5 seconds
            await this.delay(2500);
            
            if (lift.disabled) break;

            // Close doors
            await this.operateDoors(lift, false);

            // Remove active state from call button
            const callButton = document.querySelector(`[data-floor="${targetFloor}"] .call-button`);
            if (callButton) {
                callButton.classList.remove('active');
            }

            this.updateLiftStatusDisplay();
        }

        lift.isMoving = false;
        lift.direction = null;
        this.updateLiftStatusDisplay();
    }

    async animateLiftMovement(lift, targetFloor) {
        const startFloor = lift.currentFloor;
        const distance = Math.abs(targetFloor - startFloor);
        const direction = targetFloor > startFloor ? 1 : -1;

        for (let i = 1; i <= distance; i++) {
            if (lift.disabled) break;
            
            await this.delay(2000); // 2 seconds per floor
            lift.currentFloor = startFloor + (i * direction);
            this.updateLiftPosition(lift);
            this.updateLiftStatusDisplay();
        }
    }    updateLiftPosition(lift) {
        // Find all lift elements for this lift ID across all floors
        const allLiftElements = document.querySelectorAll(`[data-lift-id="${lift.id}"]`);
        
        allLiftElements.forEach(liftElement => {
            if (liftElement.classList.contains('lift')) {
                // Remove lift from current position
                liftElement.remove();
            }
        });

        // Create lift element on current floor
        const currentFloorShaft = document.querySelector(`[data-floor="${lift.currentFloor}"] .lift-shaft[data-lift-id="${lift.id}"]`);
        if (currentFloorShaft) {
            const newLiftElement = this.createLiftElement(lift.id);
            if (lift.disabled) {
                newLiftElement.classList.add('disabled');
            }
            if (lift.doorOpen) {
                const doorsElement = newLiftElement.querySelector('.lift-doors');
                if (doorsElement) {
                    doorsElement.classList.add('open');
                }
            }
            currentFloorShaft.appendChild(newLiftElement);
        }
    }

    async operateDoors(lift, open) {
        const liftElement = document.querySelector(`[data-lift-id="${lift.id}"]`);
        const doorsElement = liftElement.querySelector('.lift-doors');
        
        if (open) {
            doorsElement.classList.add('open');
            lift.doorOpen = true;
        } else {
            doorsElement.classList.remove('open');
            lift.doorOpen = false;
        }

        await this.delay(2500); // 2.5 seconds for door operation
    }

    async disableLift() {
        const liftIdInput = document.getElementById('malfunction-lift-id');
        const liftId = parseInt(liftIdInput.value);

        if (!liftId || liftId < 1 || liftId > this.lifts.length) {
            this.showStatus('Please enter a valid lift number', 'error');
            return;
        }

        const lift = this.lifts.find(l => l.id === liftId);
        if (!lift) {
            this.showStatus('Lift not found', 'error');
            return;
        }

        if (lift.disabled) {
            this.showStatus('Lift is already disabled', 'error');
            return;
        }

        // Disable the lift
        lift.disabled = true;
        lift.targetFloors = []; // Clear pending requests

        // Move to nearest floor (current floor is already nearest)
        const nearestFloor = lift.currentFloor;
        
        // Apply visual cue (red border)
        const liftElement = document.querySelector(`[data-lift-id="${lift.id}"]`);
        liftElement.classList.add('disabled');

        // Open doors and keep them open
        await this.operateDoors(lift, true);
        
        this.showStatus(`Lift ${liftId} has been disabled and moved to floor ${nearestFloor}`, 'success');
        this.updateLiftStatusDisplay();
        
        // Clear input
        liftIdInput.value = '';
    }

    enableAllLifts() {
        let disabledCount = 0;
        
        this.lifts.forEach(lift => {
            if (lift.disabled) {
                lift.disabled = false;
                disabledCount++;
                
                // Remove visual cue
                const liftElement = document.querySelector(`[data-lift-id="${lift.id}"]`);
                liftElement.classList.remove('disabled');
                
                // Close doors
                this.operateDoors(lift, false);
            }
        });

        if (disabledCount > 0) {
            this.showStatus(`${disabledCount} lift(s) have been re-enabled`, 'success');
        } else {
            this.showStatus('No disabled lifts found', 'error');
        }
        
        this.updateLiftStatusDisplay();
    }

    updateLiftStatusDisplay() {
        const container = document.getElementById('lift-status');
        container.innerHTML = '';

        this.lifts.forEach(lift => {
            const card = document.createElement('div');
            card.className = `lift-status-card ${lift.disabled ? 'disabled' : ''}`;

            const status = lift.disabled ? 'MALFUNCTIONED' : 
                          lift.isMoving ? 'MOVING' : 
                          lift.doorOpen ? 'DOORS OPEN' : 'IDLE';

            const targetFloorsText = lift.targetFloors.length > 0 ? 
                `Going to: ${lift.targetFloors.join(', ')}` : 
                'No pending requests';

            card.innerHTML = `
                <h4>Lift ${lift.id}</h4>
                <p><strong>Current Floor:</strong> ${lift.currentFloor === 0 ? 'Ground' : lift.currentFloor}</p>
                <p><strong>Status:</strong> ${status}</p>
                <p><strong>Direction:</strong> ${lift.direction || 'Stationary'}</p>
                <p><strong>Queue:</strong> ${targetFloorsText}</p>
                ${lift.disabled ? '<p style="color: #d63031; font-weight: bold;">⚠️ OUT OF SERVICE</p>' : ''}
            `;

            container.appendChild(card);
        });
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('malfunction-status');
        statusElement.textContent = message;
        statusElement.className = `status-display ${type}`;
        
        // Clear status after 5 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status-display';
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LiftSimulation();
});

// Additional utility functions for enhanced functionality
class LiftUtils {
    static calculateOptimalPath(lifts, requests) {
        // Advanced algorithm for optimal lift dispatching
        // This could be enhanced with more sophisticated algorithms
        return requests;
    }
    
    static validateFloorRange(floor, maxFloors) {
        return floor >= 0 && floor < maxFloors;
    }
    
    static formatFloorDisplay(floor) {
        return floor === 0 ? 'Ground Floor' : `Floor ${floor}`;
    }
}