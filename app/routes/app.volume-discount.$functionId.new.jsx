import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  DiscountStatus,
  MethodCard,
  RequirementType,
  SummaryCard,
} from "@shopify/discount-app-components";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  IndexTable,
  Layout,
  Page,
  PageActions,
  Text,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useField, useForm } from "@shopify/react-form";
import { CurrencyCode } from "@shopify/react-i18n";
import { useEffect, useMemo, useState } from "react";
import DiscountLevelTable from "../components/DiscountLevelTable";
import shopify from "../shopify.server";

export const action = async ({ params, request }) => {
  const { functionId } = params;
  const { admin } = await shopify.authenticate.admin(request);
  const formData = await request.formData();
  const {
    title,
    method,
    code,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    configuration,
  } = JSON.parse(formData.get("discount"));

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };

  const metafields = [
    {
      namespace: "$app:discount-test",
      key: "function-configuration",
      type: "json",
      value: JSON.stringify(
        configuration.map((c) => ({
          quantity: c.quantity,
          percentage: c.percentage,
        })),
      ),
    },
  ];

  if (method === DiscountMethod.Code) {
    const baseCodeDiscount = {
      ...baseDiscount,
      title: code,
      code,
      usageLimit,
      appliesOncePerCustomer,
    };

    const response = await admin.graphql(
      `#graphql
          mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
            discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
              codeAppDiscount{
                discountId
              }
              userErrors {
                code
                message
                field
              }
            }
          }`,
      {
        variables: {
          discount: {
            ...baseCodeDiscount,
            metafields,
          },
        },
      },
    );

    const responseJson = await response.json();

    const errors = responseJson.data.discountCreate?.userErrors;
    const discount = responseJson.data.discountCreate?.codeAppDiscount;
    return json({ errors, discount: { ...discount, functionId } });
  } else {
    const response = await admin.graphql(
      `#graphql
          mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
            discountCreate: discountAutomaticAppCreate(automaticAppDiscount: $discount) {
              automaticAppDiscount {
                discountId
              }
              userErrors {
                code
                message
                field
              }
            }
          }`,
      {
        variables: {
          discount: {
            ...baseDiscount,
            metafields,
          },
        },
      },
    );

    const responseJson = await response.json();
    const errors = responseJson.data.discountCreate?.userErrors;
    return json({ errors });
  }
};

export default function VolumeNew() {
  const submitForm = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const todaysDate = useMemo(() => new Date(), []);

  const [configurations, setConfigurations] = useState([
    { quantity: "1", percentage: "0", message: "" },
  ]);
  const [rowMarkUp, setRowMarkup] = useState([]);
  const [products, setProducts] = useState([]);

  const isLoading = navigation.state === "submitting";
  const currencyCode = CurrencyCode.Cad;
  const submitErrors = actionData?.errors || [];
  const appBridge = useAppBridge();

  const returnToDiscounts = () => open("shopify://admin/discounts", "_top");

  useEffect(() => {
    if (actionData?.errors.length === 0 && actionData?.discount) {
      returnToDiscounts();
    }
  }, [actionData]);

  const {
    fields: {
      discountTitle,
      discountCode,
      discountMethod,
      combinesWith,
      requirementType,
      requirementSubtotal,
      requirementQuantity,
      usageLimit,
      appliesOncePerCustomer,
      startDate,
      endDate,
    },
    submit,
  } = useForm({
    fields: {
      discountTitle: useField(""),
      discountMethod: useField(DiscountMethod.Code),
      discountCode: useField(""),
      combinesWith: useField({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      usageLimit: useField(null),
      appliesOncePerCustomer: useField(false),
      startDate: useField(todaysDate),
      endDate: useField(null),
    },
    onSubmit: async (form) => {
      const discountConfigs = configurations.map((config) => {
        return {
          quantity: parseInt(config.quantity),
          percentage: parseFloat(config.percentage),
        };
      });

      const discount = {
        title: form.discountTitle,
        method: form.discountMethod,
        code: form.discountCode,
        combinesWith: form.combinesWith,
        usageLimit: form.usageLimit == null ? null : parseInt(form.usageLimit),
        appliesOncePerCustomer: form.appliesOncePerCustomer,
        startsAt: form.startDate,
        endsAt: form.endDate,
        configuration: discountConfigs,
      };

      submitForm({ discount: JSON.stringify(discount) }, { method: "post" });

      return { status: "success" };
    },
  });

  const errorBanner =
    submitErrors.length > 0 ? (
      <Layout.Section>
        <Banner tone="critical">
          <p>There were some issues with your form submission:</p>
          <ul>
            {submitErrors.map(({ message, field }, index) => {
              return (
                <li key={`${message}${index}`}>
                  {field.join(".")} {message}
                </li>
              );
            })}
          </ul>
        </Banner>
      </Layout.Section>
    ) : null;

  const handleAddConfig = () => {
    setConfigurations((prev) => [
      ...prev,
      { quantity: "1", percentage: "0", message: "" },
    ]);
  };

  // Function to remove a configuration
  const handleRemoveConfig = (index) => {
    setConfigurations((prev) => prev.filter((_, i) => i !== index));
  };
  const handleConfigChange = (index, field, value) => {
    const updatedConfigurations = [...configurations];
    updatedConfigurations[index][field] = value;
    setConfigurations(updatedConfigurations);
  };

  const openResourcePicker = async () => {
    const resourcePicker = await appBridge.resourcePicker({
      type: "product",
      multiple: true,
      action: "add",
    });
    setProducts(resourcePicker);
  };

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const handleRemoveProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const rows = products.map((product, index) => (
      <IndexTable.Row id={index.toString()} position={index} key={index}>
        <IndexTable.Cell>{product.title}</IndexTable.Cell>
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
  }, [products]);

  return (
    <Page>
      <ui-title-bar title="Create volume discount">
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
        <button variant="primary" onClick={submit}>
          Save discount
        </button>
      </ui-title-bar>
      <Layout>
        {errorBanner}
        <Layout.Section>
          <Form method="post">
            <BlockStack align="space-around" gap="500">
              <MethodCard
                title="Volume"
                discountTitle={discountTitle}
                discountClass={DiscountClass.Product}
                discountCode={discountCode}
                discountMethod={discountMethod}
              />
              <Box>
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
                  </BlockStack>
                  <Divider />
                  {products.length > 0 && (
                    <div className="">
                      <IndexTable
                        resourceName={resourceName}
                        itemCount={products.length}
                        headings={["Title", "Actions"]}
                        selectable={false}
                      >
                        {rowMarkUp}
                      </IndexTable>
                    </div>
                  )}
                </Card>
              </Box>
              <DiscountLevelTable
                configurations={configurations}
                handleConfigChange={handleConfigChange}
                handleRemoveConfig={handleRemoveConfig}
                handleAddConfig={handleAddConfig}
              />
              <CombinationCard
                combinableDiscountTypes={combinesWith}
                discountClass={DiscountClass.Product}
                discountDescriptor={"Discount"}
              />
              <ActiveDatesCard
                startDate={startDate}
                endDate={endDate}
                timezoneAbbreviation="EST"
              />
            </BlockStack>
          </Form>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <SummaryCard
            header={{
              discountMethod: discountMethod.value,
              discountDescriptor:
                discountMethod.value === DiscountMethod.Automatic
                  ? discountTitle.value
                  : discountCode.value,
              appDiscountType: "Volume",
              isEditing: false,
            }}
            performance={{
              status: DiscountStatus.Scheduled,
              usageCount: 0,
              isEditing: false,
            }}
            minimumRequirements={{
              requirementType: requirementType.value,
              subtotal: requirementSubtotal.value,
              quantity: requirementQuantity.value,
              currencyCode: currencyCode,
            }}
            usageLimits={{
              oncePerCustomer: appliesOncePerCustomer.value,
              totalUsageLimit: usageLimit.value,
            }}
            activeDates={{
              startDate: startDate.value,
              endDate: endDate.value,
            }}
          />
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Save discount",
              onAction: submit,
              loading: isLoading,
            }}
            secondaryActions={[
              {
                content: "Discard",
                onAction: returnToDiscounts,
              },
            ]}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
