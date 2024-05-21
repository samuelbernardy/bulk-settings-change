import React, { ReactComponentElement, ReactElement, useEffect, useState } from 'react';
import {
  Button,
  CodeEditor,
  DataTable,
  Flex,
  FormField,
  Heading,
  Label,
  Modal,
  Paragraph,
  SelectV2,
  SelectV2Filter,
  TableColumn,
  TextInput,
  showToast,
  Text,
  CodeSnippet
} from '@dynatrace/strato-components-preview';
import { EntitiesList, monitoredEntitiesClient, SchemaList, SettingsObjectsClient, settingsObjectsClient, ObjectsList, EffectiveSettingsValuesList, SchemaDefinitionRestDto} from "@dynatrace-sdk/client-classic-environment-v2"
import { settingsSchemasClient } from "@dynatrace-sdk/client-classic-environment-v2";
import { InformationIcon, ResetIcon, ChevronLeftIcon } from '@dynatrace/strato-icons';
import { Link } from 'react-router-dom';
import { type } from 'os';

export const Get = () => {

    const [schemasList, setSchemasList] = useState<SchemaList>()
    const [schema, setSchema] = useState<string>('');
    const [propertyList, setpropertyList] = useState<Object[]>()
    const [showConfirm, setShowConfirm] = useState(false);
    const [objectCollection, setObjectCollection] = useState<Object[]>([{}]);

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

    useEffect(()=> {
    
        async function getSchemas() {
          const data = await settingsSchemasClient.getAvailableSchemaDefinitions();
          setSchemasList(data);
        }
        
        console.log('Called')
        getSchemas();
    }, []);

    const getSchema = async (schema: string, filter?: string)=> {
        let schemaDef = await settingsSchemasClient.getSchemaDefinition({
            schemaId: schema
        })
        let settingsObjects = await settingsObjectsClient.getSettingsObjects({
            schemaIds: schema,
            filter: filter ?? "",
            pageSize: 500
        })
        setObjectCollection(settingsObjects.items)
        console.log(objectCollection)
        let temp = Object.keys(schemaDef.properties)
        let propertyList: {property:string, action:ReactElement}[] = []
        temp.forEach(i => {propertyList.push(
            {
                "property": i,
                "action": (
                <Flex>
                    <Button variant="emphasized" width="full" onClick={handleAddSelect}>
                        Add
                    </Button>
                    <Button variant="emphasized" width="full" onClick={handleUpdateSelect}>
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

    useEffect(() => {
        console.log(propertyList)
    }, [propertyList])

    const handleConfirm = async () => {
        console.log(schema)
        const data = await getSchema(schema)
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
    

    return(

        <><><><><Button as={Link} to="/" variant='emphasized'>
            <ChevronLeftIcon />
            Back
        </Button><><>
            <Flex flexDirection="column" alignItems="center" padding={32}></Flex><Flex flexDirection="row" padding={32} paddingBottom={0}>
            </Flex></>
                <Flex id="Schema Select" flexDirection="column" width="100%">
                    <Label>Select a Schema</Label>
                    <SelectV2 value={schema} onChange={setSchema}>
                        <SelectV2.Trigger width="full" />
                        <SelectV2.Content>
                            <SelectV2Filter />
                            {schemasList?.items.map((schema) => (
                                // eslint-disable-next-line react/jsx-key
                                <SelectV2.Option value={schema.schemaId}>{schema.schemaId}</SelectV2.Option>
                            ))}
                        </SelectV2.Content>
                    </SelectV2>
                </Flex></></><Flex id="Submit ALl" width="100%" paddingTop={64}>
                <Button type="submit" variant="emphasized" width="full" onClick={handleConfirm}>
                    Submit
                </Button>
                <Modal
                    title="Confirm Settings Change"
                    show={showConfirm}
                    onDismiss={() => setShowConfirm(false)}
                    size="small"
                >
                    <Flex paddingRight={16} paddingTop={16}>
                        <Button type="submit" color="critical" variant="emphasized" onClick={() => setShowConfirm(false)}>
                            No
                        </Button>
                        <Button type="submit" color="success" variant="emphasized" onClick={handleConfirm}>
                            Yes
                        </Button>
                    </Flex>
                </Modal>
            </Flex></>
            <CodeSnippet language="json">{JSON.stringify(objectCollection[0], null, 2)}</CodeSnippet></>
            { <DataTable
                columns={entityColumns}
                data={propertyList ?? []}
                sortable
                fullWidth
                height={210}
            ></DataTable> }
            </>
    )
}