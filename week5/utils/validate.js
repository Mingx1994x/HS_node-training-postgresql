module.exports = {

  isUndefined: (value) => {
    return value === undefined
  },
  isNotValidString: (value) => {
    return typeof value !== "string" || value.trim().length === 0 || value === ""
  },
  isNotValidInteger: (value) => {
    return !Number.isInteger(value) || value === 0
  }
}