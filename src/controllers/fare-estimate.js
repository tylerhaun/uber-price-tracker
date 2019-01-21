import FareEstimate from "../models/fare-estimate";

class FareEstimateController {

    insert(data) {
        console.log("insert", data);
        if (Array.isArray(data)) {
            return FareEstimate.bulkCreate(data);
        }
        return FareEstimate.create(data);
        
    }

    count(query, options) {
        const finishedQuery = Object.assign({}, {where: query}, options);
        console.log("finishedQuery", finishedQuery);
        return FareEstimate.count(finishedQuery);
    }

    find(query, options) {
        const finishedQuery = Object.assign({}, {where: query}, options);
        console.log("finishedQuery", finishedQuery);
        return FareEstimate.findAll(finishedQuery);
    }

}

export default FareEstimateController;
