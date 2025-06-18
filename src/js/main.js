class LiftSimulation {
    constructor() {
        this.lifts = [];
        this.floors = 0;
        this.liftCount = 0;
        this.floorRequests = new Set();
        this.isSimulationActive = false;
        
        this.initializeEventListeners();
    }initializeEventListeners() {
    
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateSimulation();
        });

        document.getElementById('disable-lift-btn').addEventListener('click', () => {
            this.disableLift();
        });        document.getElementById('enable-all-lifts-btn').addEventListener('click', () => {
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
    }    createBuilding() {
        const buildingContainer = document.getElementById('building');
        buildingContainer.innerHTML = '';        for (let floor = this.floors - 1; floor >= 0; floor--) {
            const floorDiv = document.createElement('div');
            floorDiv.className = 'floor';
            floorDiv.setAttribute('data-floor', floor);
            
            // Calculate display floor number (reversed)
            const displayFloor = this.floors - floor - 1;

            // Floor info section
            const floorInfo = document.createElement('div');
            floorInfo.className = 'floor-info';
            
            const floorNumber = document.createElement('div');
            floorNumber.className = 'floor-number';
            floorNumber.textContent = displayFloor === 0 ? 'G' : displayFloor;
            
            const callButton = document.createElement('button');
            callButton.className = 'call-button';
            callButton.textContent = 'Call';
            callButton.addEventListener('click', () => this.callLift(floor));
            
            floorInfo.appendChild(floorNumber);
            floorInfo.appendChild(callButton);            // Lift shafts section
            const liftShafts = document.createElement('div');
            liftShafts.className = 'lift-shafts';            
            
            for (let liftId = 1; liftId <= this.lifts.length; liftId++) {
                const shaft = document.createElement('div');
                shaft.className = 'lift-shaft';
                shaft.setAttribute('data-lift-id', liftId);
                
                // Add shaft label on top floor
                if (floor === this.floors - 1) {
                    const shaftLabel = document.createElement('div');
                    shaftLabel.className = 'lift-shaft-label';
                    shaftLabel.textContent = `Lift ${liftId}`;
                    shaft.appendChild(shaftLabel);
                }

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
    }    createLiftElement(liftId) {
        const liftData = this.lifts.find(l => l.id === liftId);
        const liftColor = this.getLiftColor(liftId);
        
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.setAttribute('data-lift-id', liftId);
        // Apply custom color to lift background
        lift.style.background = liftColor.bg;
        lift.style.borderColor = `rgba(255, 255, 255, 0.7)`;

        const liftIdLabel = document.createElement('div');
        liftIdLabel.className = 'lift-id';
        liftIdLabel.textContent = `LIFT ${liftId}`;
        // Add a title attribute for accessibility
        liftIdLabel.setAttribute('title', `Elevator ${liftId}`);

        const doors = document.createElement('div');
        doors.className = 'lift-doors';

        const leftDoor = document.createElement('div');
        leftDoor.className = 'lift-door left';
        // Apply custom color to doors
        leftDoor.style.background = liftColor.door;

        const rightDoor = document.createElement('div');
        rightDoor.className = 'lift-door right';
        // Apply custom color to doors
        rightDoor.style.background = liftColor.door;        doors.appendChild(leftDoor);
        doors.appendChild(rightDoor);
        lift.appendChild(liftIdLabel);
        lift.appendChild(doors);
        
        // Add indicators
        const indicators = document.createElement('div');
        indicators.className = 'lift-indicators';        
        const floorIndicator = document.createElement('div');
        floorIndicator.className = 'floor-indicator';
        const displayFloor = this.floors - liftData.currentFloor - 1;
        floorIndicator.textContent = displayFloor === 0 ? 'G' : displayFloor;
        
        const upIndicator = document.createElement('div');
        upIndicator.className = 'direction-indicator up';
        upIndicator.innerHTML = '&#9650;'; // Unicode up arrow
        upIndicator.style.opacity = liftData.direction === 'up' ? '1' : '0.3';
        
        const downIndicator = document.createElement('div');
        downIndicator.className = 'direction-indicator down';
        downIndicator.innerHTML = '&#9660;'; // Unicode down arrow
        downIndicator.style.opacity = liftData.direction === 'down' ? '1' : '0.3';
        
        indicators.appendChild(upIndicator);
        indicators.appendChild(floorIndicator);
        indicators.appendChild(downIndicator);
        lift.appendChild(indicators);

        return lift;
    }    async callLift(targetFloor) {
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

        // Add target floor to lift's queue using the SCAN algorithm for better efficiency
        if (!bestLift.targetFloors.includes(targetFloor)) {
            bestLift.targetFloors.push(targetFloor);
            
            // Set initial direction if not already set
            if (!bestLift.direction) {
                bestLift.direction = targetFloor > bestLift.currentFloor ? 'up' : 'down';
            }
            
            // Sort target floors according to the SCAN algorithm (serve floors in current direction first)
            this.reorderTargetFloors(bestLift);
        }

        // Start moving the lift if it's not already moving
        if (!bestLift.isMoving) {
            this.moveLift(bestLift);
        }        // Show floor request status with the display floor number
        const displayFloor = this.floors - targetFloor - 1;
        this.showStatus(`Lift ${bestLift.id} is heading to floor ${displayFloor === 0 ? 'G' : displayFloor}`, 'success');
        this.updateLiftStatusDisplay();
    }
    
    reorderTargetFloors(lift) {
        const currentFloor = lift.currentFloor;
        const direction = lift.direction;
        
        if (direction === 'up') {
            // Floors above current floor, in ascending order
            const floorsAbove = lift.targetFloors.filter(floor => floor > currentFloor).sort((a, b) => a - b);
            // Floors below current floor, in descending order
            const floorsBelow = lift.targetFloors.filter(floor => floor < currentFloor).sort((a, b) => b - a);
            // Floors at current floor
            const floorsAt = lift.targetFloors.filter(floor => floor === currentFloor);
            
            lift.targetFloors = [...floorsAbove, ...floorsBelow, ...floorsAt];
        } else if (direction === 'down') {
            // Floors below current floor, in descending order
            const floorsBelow = lift.targetFloors.filter(floor => floor < currentFloor).sort((a, b) => b - a);
            // Floors above current floor, in ascending order
            const floorsAbove = lift.targetFloors.filter(floor => floor > currentFloor).sort((a, b) => a - b);
            // Floors at current floor
            const floorsAt = lift.targetFloors.filter(floor => floor === currentFloor);
            
            lift.targetFloors = [...floorsBelow, ...floorsAbove, ...floorsAt];
        }
    }    findBestLift(targetFloor) {
        const availableLifts = this.lifts.filter(lift => !lift.disabled);
        
        if (availableLifts.length === 0) return null;

        // Calculate score for each lift to find the most efficient one
        const liftScores = availableLifts.map(lift => {
            let score = 0;
            const distance = Math.abs(lift.currentFloor - targetFloor);
            
            // Base score: lower is better
            score += distance * 2; // Distance is the primary factor
            
            // Adjust score based on lift's current status
            if (lift.isMoving) {
                score += 3; // Moving lifts are less preferred
                
                // Check if the lift is moving in the same direction
                if (lift.direction === 'up' && targetFloor > lift.currentFloor) {
                    score -= 2; // Prefer lifts already moving in target direction
                } else if (lift.direction === 'down' && targetFloor < lift.currentFloor) {
                    score -= 2; // Prefer lifts already moving in target direction
                } else {
                    score += 5; // Penalize lifts moving in opposite direction
                }
                
                // Consider the number of stops in the queue
                score += lift.targetFloors.length;
            }
            
            return { lift, score };
        });
        
        // Sort by score (lower is better) and return the best lift
        liftScores.sort((a, b) => a.score - b.score);
        return liftScores[0].lift;
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
    }    async animateLiftMovement(lift, targetFloor) {
        const startFloor = lift.currentFloor;
        const distance = Math.abs(targetFloor - startFloor);
        const direction = targetFloor > startFloor ? 1 : -1;
        
        // Add direction class for animation
        const liftElement = document.querySelector(`[data-lift-id="${lift.id}"]`);
        if (liftElement) {
            if (direction > 0) {
                liftElement.classList.add('moving-up');
            } else {
                liftElement.classList.add('moving-down');
            }
            
            // Remove animation class after it completes
            setTimeout(() => {
                liftElement.classList.remove('moving-up', 'moving-down');
            }, 2000);
        }

        for (let i = 1; i <= distance; i++) {
            if (lift.disabled) break;
            
            // Show floor arrival indicator before reaching the next floor
            const nextFloor = startFloor + (i * direction);
            const nextFloorShaft = document.querySelector(`[data-floor="${nextFloor}"] .lift-shaft[data-lift-id="${lift.id}"]`);
            
            if (nextFloorShaft) {
                // Create or get floor arrival indicator
                let indicator = nextFloorShaft.querySelector('.floor-arrival-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.className = 'floor-arrival-indicator';
                    nextFloorShaft.appendChild(indicator);
                }
                
                indicator.classList.add('arriving');
                
                // Remove indicator after animation
                setTimeout(() => {
                    indicator.classList.remove('arriving');
                }, 1000);
            }
              await this.delay(2000); // 2 seconds per floor
            
            lift.currentFloor = nextFloor;
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
            
            // Update the floor indicator inside the lift to show the reversed floor number
            const floorIndicator = newLiftElement.querySelector('.floor-indicator');
            if (floorIndicator) {
                const displayFloor = this.floors - lift.currentFloor - 1;
                floorIndicator.textContent = displayFloor === 0 ? 'G' : displayFloor;
            }
            
            currentFloorShaft.appendChild(newLiftElement);
        }
    }async operateDoors(lift, open) {
        const liftElement = document.querySelector(`[data-lift-id="${lift.id}"]`);
        if (!liftElement) return;
        
        const doorsElement = liftElement.querySelector('.lift-doors');
        if (!doorsElement) return;
          if (open) {
            doorsElement.classList.add('open');
            lift.doorOpen = true;
        } else {
            doorsElement.classList.remove('open');
            lift.doorOpen = false;
        }// Update indicators
        const floorIndicator = liftElement.querySelector('.floor-indicator');
        if (floorIndicator) {
            const displayFloor = this.floors - lift.currentFloor - 1;
            floorIndicator.textContent = displayFloor === 0 ? 'G' : displayFloor;
        }
        
        const upIndicator = liftElement.querySelector('.direction-indicator.up');
        if (upIndicator) {
            upIndicator.style.opacity = lift.direction === 'up' ? '1' : '0.3';
        }
        
        const downIndicator = liftElement.querySelector('.direction-indicator.down');
        if (downIndicator) {
            downIndicator.style.opacity = lift.direction === 'down' ? '1' : '0.3';
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
        
        const displayNearestFloor = this.floors - nearestFloor - 1;
        const floorDisplay = displayNearestFloor === 0 ? 'G' : displayNearestFloor;
        this.showStatus(`Lift ${liftId} has been disabled and moved to floor ${floorDisplay}`, 'success');
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
    }    updateLiftStatusDisplay() {
        const container = document.getElementById('lift-status');
        container.innerHTML = '';

        this.lifts.forEach(lift => {
            const card = document.createElement('div');
            card.className = `lift-status-card ${lift.disabled ? 'disabled' : ''}`;

            const status = lift.disabled ? 'MALFUNCTIONED' : 
                          lift.isMoving ? 'MOVING' : 
                          lift.doorOpen ? 'DOORS OPEN' : 'IDLE';            // Format target floors for better readability with reversed numbering
            const formatFloorNumber = (floor) => {
                const displayFloor = this.floors - floor - 1;
                return displayFloor === 0 ? 'G' : displayFloor;
            };
            
            let targetFloorsText = 'No pending requests';
            if (lift.targetFloors.length > 0) {
                // Create a more visual representation of the queue
                targetFloorsText = lift.targetFloors.map(floor => {
                    const icon = floor > lift.currentFloor ? '↑' : 
                               floor < lift.currentFloor ? '↓' : '•';
                    return `${icon} ${formatFloorNumber(floor)}`;
                }).join(', ');
            }
            
            // Add visual indicators for direction and status
            const directionIcon = lift.direction === 'up' ? '↑' : 
                                lift.direction === 'down' ? '↓' : '•';
            
            const statusClass = lift.disabled ? 'status-malfunction' : 
                              lift.isMoving ? 'status-moving' : 
                              lift.doorOpen ? 'status-door-open' : 'status-idle';
            
            const displayFloor = this.floors - lift.currentFloor - 1;
            const floorIndicator = displayFloor === 0 ? 'G' : displayFloor;
              // Get lift color
            const liftColor = this.getLiftColor(lift.id);
            
            card.innerHTML = `
                <h4>
                    <span class="lift-number-indicator" style="background: ${liftColor.bg}">LIFT ${lift.id}</span>
                    <span class="status-badge ${statusClass}">${status}</span>
                </h4>
                <div class="status-row">
                    <div class="status-icon">📍</div>
                    <p><strong>Floor:</strong> <span class="floor-number-badge">${floorIndicator}</span></p>
                </div>
                <div class="status-row">
                    <div class="status-icon">${directionIcon}</div>
                    <p><strong>Direction:</strong> ${lift.direction || 'Stationary'}</p>
                </div>
                <div class="status-row">
                    <div class="status-icon">🔄</div>
                    <p><strong>Queue:</strong> ${targetFloorsText}</p>
                </div>
                ${lift.disabled ? '<p class="malfunction-warning">⚠️ OUT OF SERVICE</p>' : ''}
            `;
            
            // Apply card color accent
            card.style.borderLeftColor = liftColor.bg.split(',')[1];

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

    // Get a unique color for each lift based on its ID
    getLiftColor(liftId) {
        const colors = [
            { bg: 'linear-gradient(45deg, #f39c12, #e74c3c)', door: 'linear-gradient(90deg, #f39c12, #e74c3c)' }, // Orange-Red
            { bg: 'linear-gradient(45deg, #3498db, #2980b9)', door: 'linear-gradient(90deg, #3498db, #2980b9)' }, // Blue
            { bg: 'linear-gradient(45deg, #2ecc71, #27ae60)', door: 'linear-gradient(90deg, #2ecc71, #27ae60)' }, // Green
            { bg: 'linear-gradient(45deg, #9b59b6, #8e44ad)', door: 'linear-gradient(90deg, #9b59b6, #8e44ad)' }, // Purple
            { bg: 'linear-gradient(45deg, #1abc9c, #16a085)', door: 'linear-gradient(90deg, #1abc9c, #16a085)' }, // Teal
        ];
        
        // Get color based on lift ID (1-indexed)
        const colorIndex = (liftId - 1) % colors.length;
        return colors[colorIndex];
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