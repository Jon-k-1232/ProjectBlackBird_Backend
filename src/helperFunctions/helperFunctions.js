const dayjs = require('dayjs');

const helperFunctions = {
  /**
   * Maps a new sub property onto an object. Used when needing to add details for a specific item Ex: adding invoice details to each invoice
   * @param {*} arrayOne  Array of objects [{},{}]. Item to be appended and have a new property added
   * @param {*} detailsToAdd Array of objects [{},{}]. Details of the property add
   * @param {*} propertyToAdd A string value of what to name the new property in the object
   * @param {*} searchPropertyOne A string value of what subproperty to search off of. Ex: object.oid. Ex: detail.invoice. Property one and two get compared against each other
   * @param {*} searchPropertyTwo A second string value of what subproperty to compare against. Ex: detail.invoice. Property one and two get compared against each other
   * @returns a appended array of objects. [{},{}]. Each object is an object from arrayOne with detailsToAdd added upder propertyToAdd.
   */
  addProperty: (arrayOne, detailsToAdd, propertyToAdd, searchPropertyOne, searchPropertyTwo) => {
    // Mapping the none detail invoices to the matching invoice detail
    return arrayOne.map(itemWithoutDetail => {
      const matchingDetailItem = detailsToAdd.find(detailItem => detailItem.oid === itemWithoutDetail[searchPropertyTwo]);

      //Adding property to every item in case nothing is found.
      itemWithoutDetail[propertyToAdd] = null;

      if (matchingDetailItem[searchPropertyOne] === itemWithoutDetail[searchPropertyTwo]) {
        itemWithoutDetail[propertyToAdd] = matchingDetailItem;
      }

      return itemWithoutDetail;
    });
  },

  /**
   * Helper function to help subtract a user given time in days from todays date.
   * @param {*} time
   * @returns an object with todays date, and the calculated date
   */

  timeSubtractionFromTodayCalculator: time => {
    const currDate = dayjs().format('MM/DD/YYYY HH:mm:ss');
    const prevDate = dayjs().subtract(time, 'days').startOf('days').format('MM/DD/YYYY HH:mm:ss');
    return { prevDate, currDate };
  },

  /**
   * Sorts and array by a given object property
   * @param {*} arrayToSort Array to Objects
   * @param {*} sortProperty a property that exists on object
   * @returns Array of objects sorted
   */
  sortArrayByObjectProperty: (arrayToSort, sortProperty) => {
    arrayToSort.sort((a, b) => {
      const dateA = new Date(a[sortProperty]);
      const dateB = new Date(b[sortProperty]);
      return dateA - dateB;
    });
    return arrayToSort;
  },
};

module.exports = helperFunctions;
