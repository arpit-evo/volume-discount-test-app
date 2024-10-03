import {
  BlockStack,
  Button,
  Card,
  Divider,
  IndexTable,
  Text,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";

const ProductTable = ({ products, handleRemoveProduct, setProducts }) => {
  const appBridge = useAppBridge();
  const [rowMarkUp, setRowMarkup] = useState([]);
  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const openResourcePicker = async () => {
    const resourcePicker = await appBridge.resourcePicker({
      type: "product",
      multiple: true,
      action: "add",
    });
    setProducts(resourcePicker);
  };

  useEffect(() => {
    const rows = products.map((product, index) => (
      <IndexTable.Row id={index.toString()} position={index} key={index}>
        <IndexTable.Cell>
          <Text as="span">{product.title}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button
            icon={DeleteIcon}
            onClick={() => handleRemoveProduct(index)}
          ></Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    ));

    if (products.length > 0) {
      setRowMarkup(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  return (
    <Card>
      <BlockStack gap={400}>
        <Text as="h2" variant="headingMd">
          Select Products
        </Text>
        <Button
          onClick={async () => {
            await openResourcePicker();
          }}
          fullWidth={false}
        >
          Select Products
        </Button>
        {products?.length > 0 && (
          <>
            <Divider borderColor="border" />
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              headings={[{ title: "Title", alignment: "start" }, { title: "" }]}
              selectable={false}
            >
              {rowMarkUp}
            </IndexTable>
          </>
        )}
      </BlockStack>
    </Card>
  );
};

export default ProductTable;
