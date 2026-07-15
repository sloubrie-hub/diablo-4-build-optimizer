const SF32_OWNER_CLAIM = Object.freeze({
  type: "sf32-field-ownership",
  field: "eAttrib:994 + local-role:949",
  mustContain: Object.freeze([
    "1663210",
    "eAttrib:994",
    "Bonus_Percent_Per_Power",
    "local-role:949",
    "SF_32",
  ]),
  supersededField: "selector:949",
});

module.exports = {
  SF32_OWNER_CLAIM,
};
