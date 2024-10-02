import { BlockStack, Box, Button, Card, IndexTable, InlineGrid, Text, TextField } from '@shopify/polaris';
import React, { useEffect, useState } from 'react'
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";

const DiscountLevelTable = ({configurations, handleConfigChange, handleRemoveConfig, handleAddConfig}) => {
  const [rowMarkUp, setRowMarkup] = useState([]);
   const resourceName = {
     singular: "priceLevel",
     plural: "priceLevels",
   };

   useEffect(() => {
     const rows = configurations.map((config, index) => (
       <IndexTable.Row id={index.toString()} position={index} key={index}>
         <IndexTable.Cell>
           <TextField
             label=""
             value={config.quantity}
             onChange={(newValue) =>
               handleConfigChange(index, "quantity", newValue)
             }
             autoComplete="off"
           />
         </IndexTable.Cell>
         <IndexTable.Cell>
           <TextField
             label=""
             value={config.percentage}
             onChange={(newValue) =>
               handleConfigChange(index, "percentage", newValue)
             }
             autoComplete="off"
             suffix="%"
           />
         </IndexTable.Cell>
         <IndexTable.Cell>
           <TextField
             label=""
             value={config.message}
             onChange={(newValue) =>
               handleConfigChange(index, "message", newValue)
             }
             autoComplete="off"
           />
         </IndexTable.Cell>
         <IndexTable.Cell>
           <Button
             icon={DeleteIcon}
             onClick={() => handleRemoveConfig(index)}
           ></Button>
         </IndexTable.Cell>
       </IndexTable.Row>
     ));

     setRowMarkup(rows);
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [configurations]);

  return (
    <Card>
      <BlockStack gap="200">
        <Box paddingBlockEnd={200}>
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingMd">
              Price levels
            </Text>
            <Button
              onClick={() => handleAddConfig()}
              accessibilityLabel="Add discount"
              icon={PlusIcon}
            >
              Add level
            </Button>
          </InlineGrid>
        </Box>
        <IndexTable
          resourceName={resourceName}
          itemCount={configurations.length}
          headings={[
            { title: "Quantity" },
            { title: "Discount" },
            { title: "Message" },
            { title: "Action" },
          ]}
          selectable={false}
        >
          {rowMarkUp}
        </IndexTable>
      </BlockStack>
    </Card>
  );
}

export default DiscountLevelTable
