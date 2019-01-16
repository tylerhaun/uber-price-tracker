import FareEstimate from "../models/fare-estimate";

class FareEstimateController {

    insert(data) {
        console.log("insrt", data);
        if (Array.isArray(data)) {
            return FareEstimate.bulkCreate(data);
        }
        return FareEstimate.create(data);
        
    }

}

export default FareEstimateController;
