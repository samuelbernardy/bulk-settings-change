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
    PropertyDefinition
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

    // constant functions

    const getSchema = async (schema: string, filter?: string)=> {
        let schemaDef = await settingsSchemasClient.getSchemaDefinition({
            schemaId: schema
        })
        let settingsObjects = await settingsObjectsClient.getSettingsObjects({
            schemaIds: schema,
            filter: filter ?? "",
            pageSize: 5
        })
        setObjectCollection(settingsObjects)
        console.log(objectCollection)
        let temp = Object.keys(schemaDef.properties)
        let propertyList: {property?:string, action:ReactElement}[] = []
        temp.forEach(i => {propertyList.push(
            {
                "property": schemaDef.properties[i]?.displayName,
                "action": (
                <Flex>
                    <Button variant="emphasized" width="50%" onClick={handleAddSelect}>
                        Add
                    </Button>
                    <Button variant="emphasized" width="50%" onClick={handleUpdateSelect}>
                        Update
                    </Button>
                </Flex>)
            }
        )})
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
    const handleUpdateSelect = () => {}
    const handlepropertyList = async () => {
        const data = await settingsObjectsClient.getEffectiveSettingsValues({
            schemaIds: schema,
            scope: "environment"
        })
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
            header: 'Properties',
            accessor: 'property',
            ratioWidth: 5
        },{
            header: 'Action',
            accessor: 'action',
            ratioWidth: 1
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
            <Label>Object Preview</Label>
            <CodeSnippet maxHeight={256} language="json">{JSON.stringify(objectCollection?.items[0], null, 2)}</CodeSnippet></>
            <Paragraph>{objectCollection?.totalCount} objects to be edited</Paragraph>
            {<DataTable
                columns={entityColumns}
                data={propertyList ?? []}
                sortable
                fullWidth
                height={210}
            ></DataTable>}
            </>
    )
}