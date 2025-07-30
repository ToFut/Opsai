const fs = require('fs');
const yaml = require('js-yaml');

// Read the original YAML
const originalYaml = fs.readFileSync('templates/line-properties-config.yaml', 'utf8');
const config = yaml.load(originalYaml);

// Convert fields from array to object format
function convertFieldsToObject(fields) {
  const fieldsObj = {};
  fields.forEach(field => {
    const fieldName = field.name;
    delete field.name;
    fieldsObj[fieldName] = field;
  });
  return fieldsObj;
}

// Convert each entity
if (config.database && config.database.entities) {
  config.database.entities = config.database.entities.map(entity => {
    if (Array.isArray(entity.fields)) {
      entity.fields = convertFieldsToObject(entity.fields);
    }
    return entity;
  });
}

// Also need to convert APIs structure
if (config.apis && config.apis.integrations) {
  config.integrations = config.apis.integrations;
  delete config.apis;
}

// Save the converted YAML
const convertedYaml = yaml.dump(config, {
  indent: 2,
  lineWidth: 120,
  noRefs: true
});

fs.writeFileSync('templates/line-properties-config-converted.yaml', convertedYaml);
console.log('✅ YAML converted successfully');