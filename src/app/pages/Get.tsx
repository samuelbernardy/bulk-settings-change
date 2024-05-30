import React, { ReactComponentElement, ReactElement, useEffect, useState } from 'react';
import {
    Button,CodeEditor,DataTable,Flex,Heading,Label,Modal,
    Paragraph,SelectV2,SelectV2Filter,TableColumn,showToast,Text,CodeSnippet
  } from '@dynatrace/strato-components-preview';
  import {
    FormField,
    TextInput
  } from '@dynatrace/strato-components-preview/forms';  
import { EntitiesList, monitoredEntitiesClient, 
    SchemaList, SettingsObjectsClient, settingsObjectsClient, 
    ObjectsList, EffectiveSettingsValuesList, SchemaDefinitionRestDto,
    PropertyDefinition,
    PropertyDefinitionType,
    SettingsObject,
    SettingsObjectUpdate
} from "@dynatrace-sdk/client-classic-environment-v2"
import { settingsSchemasClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { InformationIcon, ResetIcon, ChevronLeftIcon } from '@dynatrace/strato-icons';
import { Link } from 'react-router-dom';
import { type } from 'os';

export const Get = () => {

    // state variables

    const [schemasList, setSchemasList] = useState<SchemaList>()
    const [schema, setSchema] = useState<string>('');
    const [filter, setFilter] = useState<string|undefined>();
    const [propertyList, setpropertyList] = useState<Object[]>()
    const [showConfirm, setShowConfirm] = useState(false);
    const [objectCollection, setObjectCollection] = useState<ObjectsList>();
    const [showDialogue, setShowDialogue] = useState(false);
    const [updateProperty, setUpdateProperty] = useState<string>('')
    const [updateValue, setUpdateValue] = useState<string>();
    const [updateType, setUpdateType] = useState<string>('')
    const [propertyDictionary, setPropertyDictionary] = useState({})

    // constant functions

    const getSchema = async (schema: string, filter?: string)=> {
        let schemaDef = await settingsSchemasClient.getSchemaDefinition({
            schemaId: schema
        })
        let settingsObjects = await settingsObjectsClient.getSettingsObjects({
            schemaIds: schema,
            filter: filter ?? "",
            pageSize: 1
        })
        console.log("Schema Definition")
        console.log(schemaDef)
        setObjectCollection(settingsObjects)
        console.log(objectCollection)
        const temp = Object.keys(schemaDef.properties)
        let propertyList: {property?:string, type?:PropertyDefinitionType|null, action:ReactElement}[] = []
        let index = 0
        let dict = {}
        for (const key of temp) {
            dict[schemaDef.properties[key]?.displayName ?? ""] = key
        }
        setPropertyDictionary(dict)
        temp.forEach(i => {
            let isActionable = true
            if(schemaDef.properties[i]?.type["$ref"]){isActionable = false}
            propertyList.push(
            {
                "property": schemaDef.properties[i]?.displayName,
                "type": schemaDef.properties[i]?.type["$ref"] ?? schemaDef.properties[i]?.type,
                "action": (
                <>{isActionable && <Flex >
                    <Button hidden={isActionable} variant="emphasized" width="50%" onClick={handleAddSelect}>
                        Add
                    </Button>
                    <Button variant="emphasized" width="50%" onClick={() => handleUpdateSelect(schemaDef.properties[i]?.displayName ?? "", schemaDef.properties[i]?.type["$ref"] ?? schemaDef.properties[i]?.type)}>
                        Update
                    </Button>
                </Flex>}</>)
            }
        )
        
    })
        return propertyList
    }
    const handleSubmit = () => {
        if (schema) {
            setShowConfirm(true)
        } else {
            showToast({
              type: 'critical',
              title: 'Check Content',
              message: 'Please fill out all 3 fields before submitting!'
            })
        }
    }
    const handleAddSelect = () => {}
    const handleUpdateSelect = (property:string, type) => {
        //need to display different dialogues based on the type.
        //e.g if it is a text -> textInput, boolean -> textInput, set -> something else
        setShowDialogue(true)
        setUpdateProperty(property)
        setUpdateType(type)
    }

    const handleUpdate = async () => {
        //iterate through each ObjectId
        objectCollection?.items.forEach(async element => {
            let id:string = element["objectId"] ?? "";
            let prev_object_value = element["value"] ?? {};
            console.log(id)
            //TODO - modify the right property - must map property names to field names
                //e.g. Property Enabled -> enabled
                //Management Zone -> managementZone

                //use the schemaDef.properties to get the property associated with each display name

            let prop = propertyDictionary[updateProperty] //prop now contains the actual field name, not the display name

            //modify the previous object to insert the new property + value
            if (updateType == "boolean") {
                prev_object_value[prop] = Boolean(updateValue)
            }
            else if (updateType == "text") {
                prev_object_value[prop] = updateValue
            }
            else if (updateType == "set") {
                //TODO - change the type
                prev_object_value[prop] = Boolean(updateValue)
            }
            else if(updateType == "list") {
                //TODO - change the type
                prev_object_value[prop] = Boolean(updateValue)
            }

            let update = await settingsObjectsClient.putSettingsObjectByObjectId({
                objectId: id,
                body: {
                    value: prev_object_value
                }
            })
            console.log(update)
        });        
    }
    
    const handleConfirm = async () => {
        console.log(schema)
        const data = await getSchema(schema, filter?? "")
        setpropertyList(data)
        //console.log(propertyList)
        console.log(data)
        setShowConfirm(false)
        showToast({
            title: 'Success!',
            type: 'success',
            message: (
              <>
                {schema} settings successfully fetched! 
              </>
            ),
        })
    }

    // data must contain keys for each accessor

    const entityColumns: TableColumn[] = [
        {
            header: 'Property',
            accessor: 'property',
            ratioWidth: 3
        },{
            header: 'Type',
            accessor: 'type',
            ratioWidth: 2
        },{
            header: 'Action',
            accessor: 'action',
            ratioWidth: 2
        }
    ]

    // effects 

    useEffect(()=> {
    
        async function getSchemas() {
          const data = await settingsSchemasClient.getAvailableSchemaDefinitions();
          setSchemasList(data);
        }
        
        console.log('Called')
        getSchemas();
    }, []);

    
    useEffect(() => {
        console.log(propertyList)
    }, [propertyList])

    

    return(
        <><><><><Button as={Link} to="/" variant='emphasized'>
            <ChevronLeftIcon />
            Back
        </Button><><>
            </>
                <Flex id="Schema Select" flexDirection="row" >
                    <Flex flexDirection='column' width="50%" padding={24} >
                        <FormField required={true} label="Select a Schema to Bulk Edit">
                            <SelectV2 required value={schema} onChange={setSchema}>
                                <SelectV2.Trigger width="100%" />
                                <SelectV2.Content>
                                    <SelectV2Filter />
                                    {schemasList?.items.map((schema) => (
                                        // eslint-disable-next-line react/jsx-key
                                        <SelectV2.Option value={schema.schemaId}>{schema.schemaId}</SelectV2.Option>
                                    ))}
                                </SelectV2.Content>
                            </SelectV2>
                        </FormField>
                    </Flex>
                    <Flex flexDirection='column' width="50%" padding={24} >
                        <FormField required={true} label="define a filter (Optional)">
                            <TextInput required onChange={(setFilter)}></TextInput>
                        </FormField>
                    </Flex>
                </Flex></></>
                <Flex id="Submit All" width="auto" paddingTop={8}>
                    <Button type="submit" color="primary" variant="accent" width="content" onClick={handleConfirm}>
                        Submit
                    </Button>
            </Flex></>
            <Modal
                title="Input the value to update"
                show={showDialogue}
                onDismiss={() => setShowDialogue(false)}
                size="small"
            >
                {(updateType == "boolean" || updateType == "text") && <TextInput required onChange={(setUpdateValue)}></TextInput>}
                
                {/* make this dynamic such that input fields are added the more they are used 
                updateType is being used to determine which type of input field is showing*/}
                {/* {(updateType == "set") && <TextInput required onChange={(addInputField)}></TextInput>}
                {(updateType == "list") && <Fo} */}
                <Flex paddingRight={16} paddingTop={16}>
                <Button type="submit" color="critical" variant="emphasized" onClick={() => setShowDialogue(false)}>
                    Cancel
                </Button>
                <Button type="submit" color="success" variant="emphasized" onClick={handleUpdate}>
                    Submit
                </Button>
                </Flex>
            </Modal>
                
            <Label>Object Preview</Label>
            <CodeSnippet maxHeight={256} language="json">{JSON.stringify(objectCollection?.items[0], null, 2)}</CodeSnippet></>
            <Paragraph>{objectCollection?.totalCount} objects to be edited</Paragraph>
            {<DataTable
                columns={entityColumns}
                data={propertyList ?? []}
                sortable
                fullWidth
                //height={210}
            ></DataTable>}
            </>
    )
}