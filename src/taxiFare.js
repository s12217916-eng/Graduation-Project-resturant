 @param {number} distance 
  @param {number} waitMinutes 
  @param {number} suitcases 
  @param {boolean} isRegularClient 
  @param {number} hour
  @returns {string} 
 
function calculateTaxiFare(distance, waitMinutes, suitcases, isRegularClient, hour) {
    
    let totalFare = 2.00; 

    if (distance > 1000) {
        const extraDistance = distance - 1000;
        totalFare += Math.ceil(extraDistance / 250) * 0.25;
    }
    if (waitMinutes > 3) {
        const extraWait = waitMinutes - 3;
        totalFare += Math.ceil(extraWait / 2) * 0.20;
    }

    
    if (suitcases > 1) {
        totalFare += (suitcases - 1) * 1.00;
    }

    
    const isNightTime = (hour >= 21 || hour < 6);
    if (isNightTime && !isRegularClient) {
        totalFare += totalFare * 0.25;
    }

   
    if (isRegularClient) {
        totalFare -= totalFare * 0.10;
    }

    return totalFare.toFixed(2);
}


console.log("Test Case 1 (Standard): $" + calculateTaxiFare(1500, 5, 2, false, 14));


console.log("Test Case 2 (Regular Client): $" + calculateTaxiFare(1500, 5, 2, true, 22));