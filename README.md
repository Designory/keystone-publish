# keystone-publish
A KeystoneJS plugin that enables a publishing flow between staging and production within the same application.

Keystone-publish does not in any way alter the Keystone source code. Instead it creates a middle layer on the model that makes a staging collection for every publishable production one. These collections are linked by the same mongo id. It uses pre and post save hooks to publish staging model changes to the production model (when appropriate). 


## Getting Started





## Configuration





## Customization

### Relating to Non-publishable Models

`nonPublishable: true`

Example 1: keep whole collection from taking a staging collection:
```
let modelConfig = {
	listName: 'Form',
	category: 'globals',
	nonPublishable: true,
	initialConfig: {...},
	fieldConfig:[...]
```

Example 2: keep relationship field from taking staging collection:
```
interestAreas:{
	type: Types.Relationship, 
	ref: 'Thing',
	nonPublishable: true
}
```
